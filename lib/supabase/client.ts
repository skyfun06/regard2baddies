import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase à utiliser dans les Composants Client ("use client").
 * Utilise la clé publique (anon) : sans danger côté navigateur car la
 * sécurité réelle est assurée par les policies RLS de la base.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
