"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import type { ScanInfo, ScanResult } from "@/lib/types";

/**
 * Server Actions du scanner (espace admin uniquement).
 * Chaque action vérifie que l'appelant est bien l'admin (requireAdmin) : la
 * protection ne repose jamais uniquement sur l'UET, mais aussi sur la RLS et
 * cette vérification serveur.
 *
 * Le token peut arriver "brut" (QR = juste le token) ou dans une URL/préfixe :
 * on normalise en gardant le dernier segment alphanumérique.
 */
function normaliserToken(raw: string): string {
  const t = raw.trim();
  // Retire un éventuel préfixe "r2b:" ou une URL du type .../xxxx
  const sansPrefixe = t.replace(/^r2b:/i, "");
  const segment = sansPrefixe.split(/[/?#]/).filter(Boolean).pop() ?? "";
  return segment.trim();
}

/** Recalcule l'état complet d'une cliente (source de vérité côté serveur). */
async function construireScanInfo(clienteId: string): Promise<ScanInfo | null> {
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

  // Passages "actifs" (non encore consommés par une récompense utilisée).
  const effectif = Math.max(0, total - utilisees * seuil);
  const disponibles = Math.floor(effectif / seuil); // récompenses prêtes
  const progression = effectif - disponibles * seuil; // 0..seuil-1
  const remplies = disponibles >= 1 ? seuil : progression;
  const restants = disponibles >= 1 ? 0 : seuil - progression;

  // Historique : les 10 derniers passages.
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

/** Recherche une cliente à partir de son code (QR scanné ou saisie manuelle). */
export async function chercherCliente(rawToken: string): Promise<ScanResult> {
  await requireAdmin();

  const token = normaliserToken(rawToken);
  if (!token) return { ok: false, error: "Code illisible." };

  const supabase = await createClient();
  const { data: cliente } = await supabase
    .from("clientes")
    .select("id")
    .eq("token", token)
    .maybeSingle();

  if (!cliente) return { ok: false, error: "Aucune cliente pour ce code." };

  const info = await construireScanInfo(cliente.id);
  if (!info) return { ok: false, error: "Fiche introuvable." };
  return { ok: true, info };
}

/** Enregistre un nouveau passage pour la cliente. */
export async function ajouterPassage(clienteId: string): Promise<ScanResult> {
  const admin = await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("passages")
    .insert({ cliente_id: clienteId, enregistre_par: admin.id });

  if (error) return { ok: false, error: "Le passage n'a pas pu être enregistré." };

  const info = await construireScanInfo(clienteId);
  if (!info) return { ok: false, error: "Fiche introuvable." };
  return { ok: true, info };
}

/** Marque une récompense disponible comme utilisée (remet le cycle à zéro). */
export async function marquerRecompenseUtilisee(
  clienteId: string,
): Promise<ScanResult> {
  const admin = await requireAdmin();

  // Vérifie qu'une récompense est réellement disponible avant de l'encaisser.
  const avant = await construireScanInfo(clienteId);
  if (!avant) return { ok: false, error: "Fiche introuvable." };
  if (avant.recompensesDisponibles < 1) {
    return { ok: false, error: "Aucune récompense disponible." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("recompenses")
    .insert({ cliente_id: clienteId, enregistre_par: admin.id });

  if (error) return { ok: false, error: "La récompense n'a pas pu être validée." };

  const info = await construireScanInfo(clienteId);
  if (!info) return { ok: false, error: "Fiche introuvable." };
  return { ok: true, info };
}
