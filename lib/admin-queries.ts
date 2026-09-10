import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import type { ClienteApercu } from "@/lib/types";

/**
 * Lectures de la gestion admin (Partie 3). Séparé de lib/admin-actions
 * ("use server") : ici ce sont des requêtes de LECTURE appelées directement
 * par les Server Components, pas des Server Actions exposées au client.
 */

/** Ligne brute renvoyée par l'RPC admin_clientes_apercu (voir schema.sql). */
type ApercuRow = {
  id: string;
  prenom: string;
  telephone: string | null;
  created_at: string;
  has_compte: boolean;
  total_passages: number;
  recompenses_utilisees: number;
};

/**
 * Liste toutes les clientes avec leurs compteurs, triées par prénom.
 * `recherche` filtre par prénom (insensible à la casse) ; `seulSeuilAtteint`
 * ne renvoie que les clientes ayant au moins une récompense disponible.
 */
export async function listerClientes(
  recherche?: string,
  seulSeuilAtteint = false,
): Promise<ClienteApercu[]> {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: reglages }, { data, error }] = await Promise.all([
    supabase.from("reglages").select("seuil_passages").maybeSingle(),
    supabase.rpc("admin_clientes_apercu"),
  ]);

  if (error || !data) return [];
  const seuil = Math.max(1, reglages?.seuil_passages ?? 5);
  const q = recherche?.trim().toLowerCase();

  return (data as ApercuRow[])
    .filter((r) => !q || r.prenom.toLowerCase().includes(q))
    .map((r) => {
      const total = Number(r.total_passages);
      const utilisees = Number(r.recompenses_utilisees);

      // Même logique de cycle que lib/scan-info et la carte cliente.
      const effectif = Math.max(0, total - utilisees * seuil);
      const disponibles = Math.floor(effectif / seuil);
      const progression = effectif - disponibles * seuil;
      const remplies = disponibles >= 1 ? seuil : progression;

      return {
        id: r.id,
        prenom: r.prenom,
        telephone: r.telephone,
        created_at: r.created_at,
        hasCompte: r.has_compte,
        totalPassages: total,
        remplies,
        seuil,
        recompensesDisponibles: disponibles,
      } satisfies ClienteApercu;
    })
    .filter((c) => !seulSeuilAtteint || c.recompensesDisponibles >= 1);
}
