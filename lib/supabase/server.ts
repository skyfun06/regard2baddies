import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase à utiliser dans les Composants Serveur, Route Handlers et
 * Server Actions. Il lit/écrit la session admin via les cookies.
 * La sécurité est assurée par les policies RLS (clé anon uniquement).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Appelé depuis un Composant Serveur : sans effet, le middleware
            // se charge de rafraîchir la session. On peut ignorer.
          }
        },
      },
    },
  );
}
