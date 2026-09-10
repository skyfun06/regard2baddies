import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

/**
 * Couche d'accès aux données d'authentification (DAL).
 * Centralise "qui est connecté ?" et "quel rôle ?" pour que la vérification
 * soit faite au plus près des données (recommandation Next.js), et jamais
 * seulement dans un layout.
 *
 * `cache()` mémorise le résultat pendant un même rendu : plusieurs appels à
 * getUser()/getRole() dans la même requête ne déclenchent qu'un aller-retour.
 */

/** Utilisateur Supabase connecté, ou null. Toujours vérifié côté serveur. */
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Rôle applicatif : "admin", "cliente", ou null si non connecté. */
export const getRole = cache(async (): Promise<Role> => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return admin ? "admin" : "cliente";
});

/** Garde admin : redirige vers /login si l'utilisateur n'est pas admin. */
export async function requireAdmin(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  if ((await getRole()) !== "admin") redirect("/login");
  return user;
}

/** Garde cliente : redirige vers /login si l'utilisateur n'est pas connecté. */
export async function requireCliente(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
