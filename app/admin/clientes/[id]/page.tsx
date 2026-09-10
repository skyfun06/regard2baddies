import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { construireScanInfo } from "@/lib/scan-info";
import GestionCliente from "./gestion";

/**
 * Fiche détaillée d'une cliente (gestion admin — Partie 3).
 * Charge l'état courant côté serveur (source de vérité) puis délègue les
 * actions (corriger, mot de passe, suppression) au composant client.
 */
export default async function ClienteDetailPage({
  params,
}: PageProps<"/admin/clientes/[id]">) {
  await requireAdmin();
  const { id } = await params;

  const supabase = await createClient();
  const { data: cliente } = await supabase
    .from("clientes")
    .select("id, telephone, user_id")
    .eq("id", id)
    .maybeSingle();

  const info = await construireScanInfo(id);
  if (!cliente || !info) notFound();

  return (
    <section className="space-y-5">
      <Link
        href="/admin/clientes"
        className="inline-block text-sm text-muted-foreground underline"
      >
        ‹ Toutes les clientes
      </Link>

      <GestionCliente
        clienteId={cliente.id}
        telephone={cliente.telephone}
        hasCompte={cliente.user_id !== null}
        info={info}
      />
    </section>
  );
}
