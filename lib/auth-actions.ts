"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Actions d'authentification (connexion, inscription, déconnexion).
 * Elles s'exécutent uniquement côté serveur : environnement sûr pour manipuler
 * les identifiants et poser les cookies de session (via @supabase/ssr).
 *
 * Convention : chaque action renvoie `{ error }` en cas d'échec (affiché par le
 * formulaire via useActionState), ou effectue une redirection en cas de succès.
 */

export type ActionState = { error: string } | undefined;

// --- Connexion (admin OU cliente : même formulaire) -------------------------
export async function login(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Renseigne ton email et ton mot de passe." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "Email ou mot de passe incorrect." };
  }

  // Redirige selon le rôle : admin -> /admin, cliente -> /carte.
  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  redirect(admin ? "/admin" : "/carte");
}

// --- Inscription publique d'une cliente (cible du QR de Léa) ----------------
export async function inscription(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const prenom = String(formData.get("prenom") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  // Validation minimale côté serveur (email OBLIGATOIRE).
  if (prenom.length < 2) return { error: "Indique ton prénom." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Email invalide." };
  if (password.length < 8) {
    return { error: "Le mot de passe doit faire au moins 8 caractères." };
  }

  const supabase = await createClient();

  // Création du compte. La confirmation d'email est désactivée côté Supabase :
  // la session est ouverte immédiatement (accès direct à la carte).
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { prenom } },
  });

  if (error) {
    // Message générique volontaire (ne révèle pas si l'email existe déjà).
    return { error: "Inscription impossible. Cet email est peut-être déjà utilisé." };
  }
  if (!data.user) {
    return { error: "Inscription impossible. Réessaie." };
  }

  // Crée la fiche cliente liée au compte (autorisé par la policy RLS
  // clientes_insert_self : user_id = compte tout juste connecté).
  const { error: insertError } = await supabase
    .from("clientes")
    .insert({ user_id: data.user.id, prenom });

  if (insertError) {
    return {
      error:
        "Compte créé mais ta carte n'a pas pu être initialisée. Préviens Léa.",
    };
  }

  redirect("/carte");
}

// --- Déconnexion ------------------------------------------------------------
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
