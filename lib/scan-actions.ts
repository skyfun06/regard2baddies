"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { construireScanInfo } from "@/lib/scan-info";
import type { ScanResult } from "@/lib/types";

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
