"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth";
import { construireScanInfo } from "@/lib/scan-info";
import type { ScanResult } from "@/lib/types";

/**
 * Server Actions de gestion (espace admin). Toutes vérifient requireAdmin().
 * Les opérations sur les comptes (suppression, mot de passe) utilisent la clé
 * service_role via createAdminClient() — jamais exposée au client.
 */

export type SimpleResult = { ok: true } | { ok: false; error: string };
export type PasswordResult =
  | { ok: true; password: string }
  | { ok: false; error: string };

const THEMES = [
  "rose",
  "violet",
  "jaune",
  "bleu",
  "noel",
  "halloween",
  "printemps",
  "ete",
] as const;

// --- Corriger les points : retirer le dernier passage -----------------------
export async function retirerDernierPassage(
  clienteId: string,
): Promise<ScanResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: dernier } = await supabase
    .from("passages")
    .select("id")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!dernier) return { ok: false, error: "Aucun passage à retirer." };

  const { error } = await supabase.from("passages").delete().eq("id", dernier.id);
  if (error) return { ok: false, error: "Le passage n'a pas pu être retiré." };

  const info = await construireScanInfo(clienteId);
  if (!info) return { ok: false, error: "Fiche introuvable." };
  revalidatePath("/admin/clientes");
  return { ok: true, info };
}

// --- Supprimer une cliente --------------------------------------------------
export async function supprimerCliente(clienteId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("id, user_id")
    .eq("id", clienteId)
    .maybeSingle();

  if (cliente) {
    if (cliente.user_id) {
      // Supprime le compte Auth : la fiche cliente (et ses passages /
      // récompenses) est supprimée en cascade via la clé étrangère.
      const admin = createAdminClient();
      await admin.auth.admin.deleteUser(cliente.user_id);
    } else {
      // Cliente sans compte : suppression directe de la fiche.
      await supabase.from("clientes").delete().eq("id", clienteId);
    }
  }

  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}

// --- Réinitialiser le mot de passe d'une cliente ----------------------------
export async function reinitialiserMotDePasse(
  clienteId: string,
  nouveauMotDePasse: string,
): Promise<PasswordResult> {
  await requireAdmin();

  const pwd = nouveauMotDePasse.trim();
  if (pwd.length < 8) {
    return { ok: false, error: "Le mot de passe doit faire au moins 8 caractères." };
  }

  const supabase = await createClient();
  const { data: cliente } = await supabase
    .from("clientes")
    .select("user_id")
    .eq("id", clienteId)
    .maybeSingle();

  if (!cliente?.user_id) {
    return { ok: false, error: "Cette cliente n'a pas de compte à réinitialiser." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(cliente.user_id, {
    password: pwd,
  });

  if (error) return { ok: false, error: "Échec de la réinitialisation." };
  return { ok: true, password: pwd };
}

// --- Mettre à jour les réglages (seuil, récompense, thème) ------------------
export async function updateReglages(
  _prev: SimpleResult | undefined,
  formData: FormData,
): Promise<SimpleResult> {
  await requireAdmin();

  const seuil = Number(formData.get("seuil_passages"));
  const valeur = Number(formData.get("valeur_recompense"));
  const theme = String(formData.get("theme_actif") ?? "");

  if (!Number.isInteger(seuil) || seuil < 1) {
    return { ok: false, error: "Le seuil doit être un entier ≥ 1." };
  }
  if (!Number.isInteger(valeur) || valeur < 0) {
    return { ok: false, error: "La valeur de récompense doit être un entier ≥ 0." };
  }
  if (!THEMES.includes(theme as (typeof THEMES)[number])) {
    return { ok: false, error: "Thème inconnu." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("reglages")
    .update({
      seuil_passages: seuil,
      valeur_recompense: valeur,
      theme_actif: theme,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  if (error) return { ok: false, error: "Les réglages n'ont pas pu être enregistrés." };

  // Le thème est lu dans le layout racine : on rafraîchit toute l'app.
  revalidatePath("/", "layout");
  return { ok: true };
}
