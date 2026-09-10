-- ===========================================================================
-- Regard2Baddies — Schéma de base de données (Supabase / PostgreSQL)
-- ===========================================================================
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run.
-- Idempotent autant que possible : ré-exécutable sans casser l'existant.
--
-- Modèle de sécurité (Partie 1 — comptes & accès) :
--   - RLS activée sur TOUTES les tables.
--   - Deux rôles applicatifs, distingués par la table `admins` :
--       * ADMIN (Léa) : son user_id figure dans `public.admins` -> accès total.
--       * CLIENTE     : compte connecté lié à une ligne `clientes` (user_id)
--                       -> ne voit QUE sa propre carte, jamais celle des autres.
--   - Le public non connecté (`anon`) n'a AUCUN accès direct aux tables.
--   - Accès public à la carte par token conservé via `get_carte_by_token`.
-- ===========================================================================

-- Nécessaire pour gen_random_uuid() et gen_random_bytes()
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Table : admins (liste des comptes administrateurs — normalement Léa seule)
-- ---------------------------------------------------------------------------
-- On y ajoute l'admin À LA MAIN, une fois son compte créé dans
-- Authentication > Users. Voir la requête d'amorçage en bas de fichier.
create table if not exists public.admins (
  user_id    uuid        primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Table : clientes
-- ---------------------------------------------------------------------------
create table if not exists public.clientes (
  id         uuid        primary key default gen_random_uuid(),
  prenom     text        not null,
  telephone  text,                                   -- optionnel
  token      text        not null unique
             default encode(gen_random_bytes(16), 'hex'),  -- code à faire scanner
  created_at timestamptz not null default now()
);

-- Lien vers le compte Auth de la cliente (ajouté en Partie 1).
-- Nullable pour rester compatible avec d'éventuelles clientes créées à la main
-- par l'admin (sans compte). Unique : un compte = au plus une cliente.
alter table public.clientes
  add column if not exists user_id uuid unique references auth.users(id) on delete cascade;

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
-- Helper : is_admin() — vrai si l'utilisateur connecté est un admin.
-- ===========================================================================
-- SECURITY DEFINER pour pouvoir lire `admins` indépendamment de la RLS, sans
-- risque de récursion de policy. Utilisé dans toutes les policies "admin".
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.admins   enable row level security;
alter table public.clientes enable row level security;
alter table public.passages enable row level security;
alter table public.reglages enable row level security;

-- --- admins : seul un admin peut lire la liste des admins ------------------
drop policy if exists "admins_select_admin" on public.admins;
create policy "admins_select_admin" on public.admins
  for select to authenticated using (public.is_admin());

-- --- clientes --------------------------------------------------------------
-- (on supprime l'ancienne policy "tout authentifié = admin")
drop policy if exists "admin_all_clientes" on public.clientes;

-- L'admin peut tout faire sur toutes les clientes.
drop policy if exists "clientes_admin_all" on public.clientes;
create policy "clientes_admin_all" on public.clientes
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Une cliente peut lire UNIQUEMENT sa propre fiche.
drop policy if exists "clientes_select_self" on public.clientes;
create policy "clientes_select_self" on public.clientes
  for select to authenticated
  using (user_id = auth.uid());

-- Une cliente peut créer SA propre fiche à l'inscription (user_id = elle-même).
drop policy if exists "clientes_insert_self" on public.clientes;
create policy "clientes_insert_self" on public.clientes
  for insert to authenticated
  with check (user_id = auth.uid());
-- NB : pas de policy UPDATE/DELETE pour la cliente -> seule Léa modifie/supprime.

-- --- passages --------------------------------------------------------------
drop policy if exists "admin_all_passages" on public.passages;

drop policy if exists "passages_admin_all" on public.passages;
create policy "passages_admin_all" on public.passages
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Une cliente lit uniquement les passages rattachés à SA fiche.
drop policy if exists "passages_select_self" on public.passages;
create policy "passages_select_self" on public.passages
  for select to authenticated
  using (
    exists (
      select 1 from public.clientes c
      where c.id = passages.cliente_id and c.user_id = auth.uid()
    )
  );

-- --- reglages --------------------------------------------------------------
drop policy if exists "admin_all_reglages" on public.reglages;

drop policy if exists "reglages_admin_all" on public.reglages;
create policy "reglages_admin_all" on public.reglages
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Toute personne connectée peut LIRE les réglages (seuil, récompense, thème)
-- pour afficher sa carte. Ces valeurs ne sont pas sensibles.
drop policy if exists "reglages_select_auth" on public.reglages;
create policy "reglages_select_auth" on public.reglages
  for select to authenticated using (true);

-- ===========================================================================
-- Accès public à la carte cliente, par token (lecture seule, sécurisée)
-- ===========================================================================
-- SECURITY DEFINER : contourne la RLS mais ne renvoie QUE la carte du token
-- fourni. Renvoie 0 ligne si le token est invalide. Conservé pour un éventuel
-- accès sans connexion (ex : lien direct), en complément des comptes clientes.
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

-- ===========================================================================
-- AMORÇAGE DE L'ADMIN (à exécuter une fois, après avoir créé le compte de Léa
-- dans Authentication > Users). Remplace l'email par celui du compte admin :
-- ===========================================================================
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'lea@exemple.com'
-- on conflict (user_id) do nothing;
