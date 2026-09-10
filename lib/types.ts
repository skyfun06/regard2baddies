/**
 * Types applicatifs correspondant au schéma SQL (voir supabase/schema.sql).
 * À terme, on pourra les générer automatiquement avec la CLI Supabase
 * (`supabase gen types typescript`), mais on les garde à la main pour l'instant.
 */

export type Cliente = {
  id: string;
  prenom: string;
  telephone: string | null;
  token: string;
  user_id: string | null; // lien vers le compte Auth de la cliente
  created_at: string;
};

/** Ligne de la table `admins` (comptes administrateurs). */
export type Admin = {
  user_id: string;
  created_at: string;
};

/** Rôle applicatif de l'utilisateur connecté. */
export type Role = "admin" | "cliente" | null;

export type Passage = {
  id: string;
  cliente_id: string;
  created_at: string;
  enregistre_par: string | null;
};

export type Reglages = {
  id: boolean;
  seuil_passages: number;
  valeur_recompense: number;
  theme_actif: string;
  updated_at: string;
};

/** Aperçu d'une cliente pour la liste admin (avec compteurs dérivés). */
export type ClienteApercu = {
  id: string;
  prenom: string;
  telephone: string | null;
  created_at: string;
  hasCompte: boolean; // possède un compte (peut réinitialiser son mot de passe)
  totalPassages: number;
  remplies: number; // cases du cycle courant
  seuil: number;
  recompensesDisponibles: number; // >0 => a atteint le seuil
};

/** Ligne de la table `recompenses` (une récompense utilisée / remise). */
export type Recompense = {
  id: string;
  cliente_id: string;
  utilisee_le: string;
  enregistre_par: string | null;
};

/**
 * État d'une cliente affiché côté scanner admin après lecture du code.
 * Toutes les valeurs sont dérivées côté serveur (source de vérité).
 */
export type ScanInfo = {
  clienteId: string;
  prenom: string;
  totalPassages: number; // total historique (toutes cartes confondues)
  seuil: number; // passages requis pour une récompense
  valeurRecompense: number; // valeur en € de la récompense
  remplies: number; // cases remplies dans le cycle courant
  restants: number; // passages restants avant la prochaine récompense
  recompensesDisponibles: number; // récompenses acquises non encore utilisées
  historique: { id: string; created_at: string }[]; // derniers passages
};

/** Résultat d'une action scan : succès (avec info) ou échec (message). */
export type ScanResult =
  | { ok: true; info: ScanInfo }
  | { ok: false; error: string };

/** Résultat de la fonction RPC `get_carte_by_token` (accès public à la carte). */
export type CarteCliente = {
  prenom: string;
  nb_passages: number;
  seuil_passages: number;
  valeur_recompense: number;
  theme_actif: string;
  created_at: string;
};
