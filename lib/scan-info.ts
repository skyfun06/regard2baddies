import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ScanInfo } from "@/lib/types";

/**
 * Recalcule l'état complet d'une cliente (source de vérité côté serveur),
 * partagé par le scanner (lib/scan-actions) et la gestion (lib/admin-actions).
 *
 * Progression du cycle courant :
 *   effectif = total_passages - (récompenses_utilisées * seuil)
 *   récompenses disponibles = floor(effectif / seuil)
 */
export async function construireScanInfo(
  clienteId: string,
): Promise<ScanInfo | null> {
  const supabase = await createClient();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("id, prenom")
    .eq("id", clienteId)
    .maybeSingle();

  if (!cliente) return null;

  const [{ count: nbPassages }, { count: nbRecompenses }, { data: reglages }] =
    await Promise.all([
      supabase
        .from("passages")
        .select("*", { count: "exact", head: true })
        .eq("cliente_id", clienteId),
      supabase
        .from("recompenses")
        .select("*", { count: "exact", head: true })
        .eq("cliente_id", clienteId),
      supabase
        .from("reglages")
        .select("seuil_passages, valeur_recompense")
        .maybeSingle(),
    ]);

  const total = nbPassages ?? 0;
  const utilisees = nbRecompenses ?? 0;
  const seuil = Math.max(1, reglages?.seuil_passages ?? 5);
  const valeur = reglages?.valeur_recompense ?? 20;

  const effectif = Math.max(0, total - utilisees * seuil);
  const disponibles = Math.floor(effectif / seuil);
  const progression = effectif - disponibles * seuil;
  const remplies = disponibles >= 1 ? seuil : progression;
  const restants = disponibles >= 1 ? 0 : seuil - progression;

  const { data: historique } = await supabase
    .from("passages")
    .select("id, created_at")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false })
    .limit(10);

  return {
    clienteId: cliente.id,
    prenom: cliente.prenom,
    totalPassages: total,
    seuil,
    valeurRecompense: valeur,
    remplies,
    restants,
    recompensesDisponibles: disponibles,
    historique: historique ?? [],
  };
}
