import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Rafraîchit la session admin à chaque requête et la propage via les cookies.
 * Appelé depuis `middleware.ts` (racine du projet).
 *
 * NOTE : la protection des routes /admin (redirection vers /login si non
 * connecté) sera ajoutée ici plus tard, quand on codera l'authentification.
 * Pour l'instant on se contente de maintenir la session à jour.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT : ne rien exécuter entre la création du client et getUser().
  await supabase.auth.getUser();

  return supabaseResponse;
}
