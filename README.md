# Regard2Baddies

Carte de fidélité digitale pour prothésiste ongulaire/cils.
**Mobile-first** — pensée pour téléphone et tablette.

- **Framework** : Next.js 16 (App Router) + TypeScript
- **Styles** : Tailwind CSS v4 (thème par variables CSS)
- **Base de données / Auth** : Supabase
- **Déploiement** : Vercel
- **PWA** : installable sur écran d'accueil

> État actuel : **setup uniquement**. Les fonctionnalités seront ajoutées une par une.

## Démarrage

### 1. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) → **New project**.
2. Une fois créé, ouvre **Project Settings → API** et note :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (secret) → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Variables d'environnement

```bash
cp .env.example .env.local
```

Puis colle tes 3 valeurs dans `.env.local` (ce fichier n'est jamais versionné).

### 3. Créer les tables

Dans Supabase → **SQL Editor → New query**, colle le contenu de
[`supabase/schema.sql`](supabase/schema.sql) et clique **Run**.
Cela crée les tables (`clientes`, `passages`, `reglages`), active la RLS et
crée la fonction d'accès public à la carte par token.

### 4. Créer le compte admin unique

Dans Supabase → **Authentication → Users → Add user** :
crée un utilisateur avec e-mail + mot de passe. C'est le **seul** compte de
gestion. (La page de connexion `/login` sera codée plus tard.)

### 5. Lancer en local

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Structure

```
app/
  layout.tsx            # layout racine (PWA, thème actif, mobile-first)
  globals.css           # variables sémantiques + pont Tailwind
  themes.css            # palettes (rose, violet, jaune, bleu + saisonnières)
  page.tsx              # /            carte cliente (accès par token)
  admin/
    layout.tsx          # coquille de l'espace admin
    page.tsx            # /admin       tableau de bord
    scan/page.tsx       # /admin/scan  scanner
    clientes/page.tsx   # /admin/clientes  liste des clientes
lib/
  supabase/
    client.ts           # client navigateur (clé anon)
    server.ts           # client serveur (cookies/session)
    admin.ts            # client service_role (serveur uniquement)
    middleware.ts       # rafraîchissement de session
  types.ts              # types TS du schéma
middleware.ts           # branche le rafraîchissement de session
supabase/schema.sql     # schéma SQL + RLS
public/
  manifest.webmanifest  # PWA
  icon-192.png / icon-512.png  # icônes (placeholder à remplacer par le logo)
```

## Changer de thème

Toutes les couleurs passent par des variables CSS sémantiques
(`--primary`, `--surface`, `--accent`…). Pour changer toute la palette d'un
coup, il suffit de changer l'attribut `data-theme` sur `<html>`
(dans `app/layout.tsx`), parmi : `rose`, `violet`, `jaune`, `bleu`, `noel`,
`halloween`, `printemps`, `ete`. Pour ajouter une palette : dupliquer un bloc
`[data-theme="..."]` dans `app/themes.css`.
