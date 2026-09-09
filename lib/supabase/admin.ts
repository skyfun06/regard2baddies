import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase "administrateur" utilisant la clé service_role.
 *
 * ⚠️  SERVEUR UNIQUEMENT. Ne jamais importer ce fichier dans un Composant
 * Client ("use client") : la clé service_role contourne TOUTES les policies
 * RLS et donne un accès total à la base.
 *
 * À réserver aux opérations serveur qui doivent explicitement passer outre la
 * RLS. Pour l'accès public à la carte cliente (par token), on utilisera plutôt
 * la fonction RPC `get_carte_by_token` avec la clé anon.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
