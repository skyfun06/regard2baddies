import Link from "next/link";
import { listerClientes } from "@/lib/admin-queries";

/**
 * Liste de toutes les clientes (gestion admin — Partie 3).
 * - Recherche par prénom via le paramètre `?q=`.
 * - Filtre "a atteint le seuil" via `?seuil=1`.
 * L'accès admin est garanti par le layout ET par listerClientes (requireAdmin).
 */
export default async function ClientesPage({
  searchParams,
}: PageProps<"/admin/clientes">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const seulSeuil = params.seuil === "1";

  const clientes = await listerClientes(q, seulSeuil);

  return (
    <section className="space-y-5">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-lg font-semibold">Clientes</h1>
        <span className="text-sm text-muted-foreground">
          {clientes.length} au total
        </span>
      </div>

      {/* Recherche par prénom (GET : le prénom reste dans l'URL, partageable) */}
      <form method="get" className="flex gap-2">
        {seulSeuil && <input type="hidden" name="seuil" value="1" />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher un prénom…"
          aria-label="Rechercher un prénom"
          className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Chercher
        </button>
      </form>

      {/* Filtre : uniquement celles ayant atteint le seuil */}
      <div className="flex gap-2 text-sm">
        <FiltreLien label="Toutes" actif={!seulSeuil} q={q} seuil={false} />
        <FiltreLien
          label="🎉 Récompense prête"
          actif={seulSeuil}
          q={q}
          seuil
        />
      </div>

      {clientes.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
          Aucune cliente ne correspond.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {clientes.map((c) => {
            const prete = c.recompensesDisponibles >= 1;
            return (
              <li key={c.id}>
                <Link
                  href={`/admin/clientes/${c.id}`}
                  className="flex items-center gap-3 p-4 transition hover:bg-muted"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-medium">
                      <span className="truncate">{c.prenom}</span>
                      {prete && (
                        <span className="shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
                          Récompense
                          {c.recompensesDisponibles > 1
                            ? ` ×${c.recompensesDisponibles}`
                            : ""}
                        </span>
                      )}
                      {!c.hasCompte && (
                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          sans compte
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {c.totalPassages} passage{c.totalPassages > 1 ? "s" : ""}
                      {" · "}
                      {c.remplies}/{c.seuil} cette carte
                    </p>
                  </div>
                  <span aria-hidden className="text-muted-foreground">
                    ›
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Petit lien de filtre (conserve la recherche `q` courante). */
function FiltreLien({
  label,
  actif,
  q,
  seuil,
}: {
  label: string;
  actif: boolean;
  q: string;
  seuil: boolean;
}) {
  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  if (seuil) sp.set("seuil", "1");
  const href = sp.toString() ? `?${sp.toString()}` : "/admin/clientes";
  return (
    <Link
      href={href}
      className={
        "rounded-full border px-3 py-1 transition " +
        (actif
          ? "border-primary bg-primary/10 font-medium text-primary"
          : "border-border text-muted-foreground hover:bg-muted")
      }
    >
      {label}
    </Link>
  );
}
