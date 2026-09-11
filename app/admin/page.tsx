import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { listerClientes } from "@/lib/admin-queries";

/** Tableau de bord admin (Partie 3) : récap et accès rapide. */
export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [clientes, { data: reglages }] = await Promise.all([
    listerClientes(),
    supabase
      .from("reglages")
      .select("seuil_passages, valeur_recompense, theme_actif")
      .maybeSingle(),
  ]);

  const pretes = clientes.filter((c) => c.recompensesDisponibles >= 1);

  return (
    <section className="space-y-6">
      <h1 className="y2k-display text-2xl text-primary">Tableau de bord</h1>

      {/* Compteurs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="y2k-card p-4">
          <p className="y2k-display text-3xl text-primary">{clientes.length}</p>
          <p className="text-sm text-muted-foreground">
            cliente{clientes.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/clientes?seuil=1"
          className="y2k-card p-4 transition hover:brightness-[1.02]"
        >
          <p className="y2k-display text-3xl text-success">{pretes.length}</p>
          <p className="text-sm text-muted-foreground">ont atteint le seuil</p>
        </Link>
      </div>

      {/* Qui a atteint le seuil */}
      <section className="y2k-card p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="y2k-display text-base text-primary">Récompenses prêtes</h2>
          {pretes.length > 0 && (
            <Link
              href="/admin/clientes?seuil=1"
              className="text-sm text-muted-foreground underline"
            >
              Tout voir
            </Link>
          )}
        </div>
        {pretes.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Aucune récompense à remettre pour l&apos;instant.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border text-sm">
            {pretes.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/clientes/${c.id}`}
                  className="flex items-center justify-between py-2"
                >
                  <span className="font-medium">{c.prenom}</span>
                  <span className="text-success">
                    {c.recompensesDisponibles > 1
                      ? `×${c.recompensesDisponibles}`
                      : "prête"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Réglages courants */}
      <Link
        href="/admin/reglages"
        className="y2k-card block p-4 transition hover:brightness-[1.02]"
      >
        <div className="flex items-center justify-between">
          <h2 className="y2k-display text-base text-primary">Réglages</h2>
          <span className="text-sm text-muted-foreground underline">
            Modifier
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Seuil : {reglages?.seuil_passages ?? 5} passages · Récompense :{" "}
          {reglages?.valeur_recompense ?? 20} € · Thème :{" "}
          {reglages?.theme_actif ?? "rose"}
        </p>
      </Link>

      {/* Accès rapides */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/admin/scan"
          className="y2k-btn p-4 text-center text-lg"
        >
          Scanner
        </Link>
        <Link
          href="/admin/qr"
          className="y2k-btn-outline p-4 text-center text-lg"
        >
          QR d&apos;inscription
        </Link>
      </div>
    </section>
  );
}
