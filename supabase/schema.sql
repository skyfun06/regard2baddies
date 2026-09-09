-- ===========================================================================
-- Regard2Baddies — Schéma de base de données (Supabase / PostgreSQL)
-- ===========================================================================
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run.
-- Idempotent autant que possible : ré-exécutable sans casser l'existant.
--
-- Modèle de sécurité :
--   - RLS activée sur TOUTES les tables.
--   - L'admin (unique compte Supabase Auth) = tout utilisateur `authenticated`
--     -> accès complet via policies.
--   - Le public (`anon`) n'a AUCUN accès direct aux tables.
--   - La cliente accède à sa carte via la fonction `get_carte_by_token`
--     (SECURITY DEFINER) : elle ne peut lire QUE sa carte, à partir de son token.
-- ===========================================================================

-- Nécessaire pour gen_random_uuid() et gen_random_bytes()
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Table : clientes
-- ---------------------------------------------------------------------------
create table if not exists public.clientes (
  id         uuid        primary key default gen_random_uuid(),
  prenom     text        not null,
  telephone  text,                                   -- optionnel
  token      text        not null unique
             default encode(gen_random_bytes(16), 'hex'),  -- accès à la carte
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Table : passages (chaque visite comptabilisée)
-- ---------------------------------------------------------------------------
create table if not exists public.passages (
  id             uuid        primary key default gen_random_uuid(),
  cliente_id     uuid        not null
                 references public.clientes(id) on delete cascade,
  created_at     timestamptz not null default now(),   -- date du passage
  enregistre_par uuid        references auth.users(id)  -- qui l'a enregistré
);

create index if not exists passages_cliente_id_idx
  on public.passages (cliente_id);

-- ---------------------------------------------------------------------------
-- Table : reglages (ligne unique de configuration)
-- ---------------------------------------------------------------------------
-- Astuce "single row" : clé primaire booléenne contrainte à `true`,
-- donc une seule ligne possible.
create table if not exists public.reglages (
  id                boolean     primary key default true,
  seuil_passages    int         not null default 5,   -- passages pour récompense
  valeur_recompense int         not null default 20,  -- valeur de la récompense
  theme_actif       text        not null default 'rose',
  updated_at        timestamptz not null default now(),
  constraint reglages_single_row check (id)
);

-- Crée la ligne de réglages par défaut si absente
insert into public.reglages (id) values (true)
  on conflict (id) do nothing;

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.clientes enable row level security;
alter table public.passages enable row level security;
alter table public.reglages enable row level security;

-- --- Policies admin (tout utilisateur connecté = l'admin unique) ------------
drop policy if exists "admin_all_clientes" on public.clientes;
create policy "admin_all_clientes" on public.clientes
  for all to authenticated using (true) with check (true);

drop policy if exists "admin_all_passages" on public.passages;
create policy "admin_all_passages" on public.passages
  for all to authenticated using (true) with check (true);

drop policy if exists "admin_all_reglages" on public.reglages;
create policy "admin_all_reglages" on public.reglages
  for all to authenticated using (true) with check (true);

-- Aucune policy pour `anon` : le public ne peut pas lire les tables
-- directement. L'accès à la carte passe uniquement par la fonction ci-dessous.

-- ===========================================================================
-- Accès public à la carte cliente, par token (lecture seule, sécurisée)
-- ===========================================================================
-- SECURITY DEFINER : s'exécute avec les droits du propriétaire et contourne la
-- RLS, mais ne renvoie QUE les données de la carte correspondant au token
-- fourni. Renvoie 0 ligne si le token est invalide.
create or replace function public.get_carte_by_token(p_token text)
returns table (
  prenom            text,
  nb_passages       bigint,
  seuil_passages    int,
  valeur_recompense int,
  theme_actif       text,
  created_at        timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    c.prenom,
    count(p.id)          as nb_passages,
    r.seuil_passages,
    r.valeur_recompense,
    r.theme_actif,
    c.created_at
  from public.clientes c
  cross join public.reglages r
  left join public.passages p on p.cliente_id = c.id
  where c.token = p_token
  group by c.prenom, c.created_at,
           r.seuil_passages, r.valeur_recompense, r.theme_actif;
$$;

grant execute on function public.get_carte_by_token(text) to anon, authenticated;
