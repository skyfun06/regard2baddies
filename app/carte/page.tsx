import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/supabase/auth";
import { logout } from "@/lib/auth-actions";

/**
 * Carte de fidélité de la cliente connectée.
 * Grâce à la RLS, chaque requête ne renvoie QUE les données de cette cliente —
 * une cliente ne peut jamais voir la carte d'une autre.
 */
export default async function CartePage() {
  const role = await getRole();
  if (!role) redirect("/login");
  if (role === "admin") redirect("/admin");

  const supabase = await createClient();

  // Fiche de la cliente (RLS : uniquement la sienne).
  const { data: cliente } = await supabase
    .from("clientes")
    .select("id, prenom, token")
    .maybeSingle();

  if (!cliente) {
    // Compte connecté sans fiche cliente : cas anormal (à traiter avec Léa).
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            Ta carte n&apos;est pas encore initialisée. Préviens Léa.
          </p>
          <form action={logout} className="mt-4">
            <button className="text-sm font-medium text-primary underline">
              Se déconnecter
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Nombre de passages (RLS : uniquement ceux de cette cliente).
  const { count } = await supabase
    .from("passages")
    .select("*", { count: "exact", head: true })
    .eq("cliente_id", cliente.id);

  // Réglages (seuil de passages, valeur de la récompense).
  const { data: reglages } = await supabase
    .from("reglages")
    .select("seuil_passages, valeur_recompense")
    .maybeSingle();

  const total = count ?? 0;
  const seuil = reglages?.seuil_passages ?? 5;
  const valeur = reglages?.valeur_recompense ?? 20;

  // Progression dans le cycle courant.
  const dansCycle = total % seuil;
  const recompensePrete = total > 0 && dansCycle === 0;
  const remplies = recompensePrete ? seuil : dansCycle;
  const restants = recompensePrete ? 0 : seuil - dansCycle;

  return (
    <main className="flex flex-1 flex-col items-center p-6">
      <div className="w-full max-w-sm space-y-6">
        {/* En-tête */}
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Ta carte</p>
            <h1 className="text-2xl font-bold text-primary">
              {cliente.prenom}
            </h1>
          </div>
          <form action={logout}>
            <button className="text-sm text-muted-foreground underline">
              Déconnexion
            </button>
          </form>
        </header>

        {/* Cases de fidélité */}
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: seuil }).map((_, i) => {
              const active = i < remplies;
              return (
                <div
                  key={i}
                  className={
                    "flex aspect-square items-center justify-center rounded-full border text-lg font-semibold " +
                    (active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted text-muted-foreground")
                  }
                  aria-label={active ? "Passage validé" : "Case vide"}
                >
                  {active ? "★" : ""}
                </div>
              );
            })}
          </div>

          <p className="mt-5 text-center text-sm">
            {recompensePrete ? (
              <span className="font-semibold text-success">
                🎉 Récompense débloquée : {valeur} € offerts !
              </span>
            ) : (
              <>
                Encore{" "}
                <span className="font-semibold text-primary">{restants}</span>{" "}
                passage{restants > 1 ? "s" : ""} avant ta récompense de{" "}
                <span className="font-semibold">{valeur} €</span>.
              </>
            )}
          </p>
        </section>

        {/* Code à faire scanner par Léa */}
        <section className="rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
          <p className="text-sm font-medium">Ton code à faire scanner</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Montre-le à Léa à chaque passage.
          </p>
          <div className="mt-4 break-all rounded-xl bg-muted px-4 py-3 font-mono text-sm tracking-wider">
            {cliente.token}
          </div>
        </section>
      </div>
    </main>
  );
}
