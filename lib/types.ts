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
  created_at: string;
};

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

/** Résultat de la fonction RPC `get_carte_by_token` (accès public à la carte). */
export type CarteCliente = {
  prenom: string;
  nb_passages: number;
  seuil_passages: number;
  valeur_recompense: number;
  theme_actif: string;
  created_at: string;
};
