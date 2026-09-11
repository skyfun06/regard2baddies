import QRCode from "qrcode";
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
        <div className="y2k-card w-full max-w-sm p-6 text-center">
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

  // Compteurs (RLS : uniquement les données de cette cliente).
  const [{ count: nbPassages }, { count: nbRecompenses }, { data: reglages }] =
    await Promise.all([
      supabase
        .from("passages")
        .select("*", { count: "exact", head: true })
        .eq("cliente_id", cliente.id),
      supabase
        .from("recompenses")
        .select("*", { count: "exact", head: true })
        .eq("cliente_id", cliente.id),
      supabase
        .from("reglages")
        .select("seuil_passages, valeur_recompense")
        .maybeSingle(),
    ]);

  const total = nbPassages ?? 0;
  const utilisees = nbRecompenses ?? 0;
  const seuil = Math.max(1, reglages?.seuil_passages ?? 5);
  const valeur = reglages?.valeur_recompense ?? 20;

  // Même logique que le scanner admin (source de vérité partagée) :
  // passages actifs = total - récompenses déjà utilisées * seuil.
  const effectif = Math.max(0, total - utilisees * seuil);
  const disponibles = Math.floor(effectif / seuil);
  const progression = effectif - disponibles * seuil;
  const recompensePrete = disponibles >= 1;
  const remplies = recompensePrete ? seuil : progression;
  const restants = recompensePrete ? 0 : seuil - progression;

  // QR code encodant le token (généré côté serveur, sans JS client).
  const qrSvg = await QRCode.toString(cliente.token, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#3b0f33", light: "#ffffff" },
  });

  return (
    <main className="relative flex flex-1 flex-col items-center overflow-hidden px-6 py-10">
      <div className="w-full max-w-sm space-y-8">
        {/* En-tête */}
        <header className="flex items-end justify-between gap-4">
          <div>
            <span className="y2k-chip text-xs font-medium text-muted-foreground">
              Ta carte
            </span>
            <h1 className="y2k-display mt-3 text-4xl text-primary">
              {cliente.prenom}
            </h1>
          </div>
          <form action={logout}>
            <button className="text-sm text-muted-foreground underline">
              Déconnexion
            </button>
          </form>
        </header>

        {/* Cases de fidélité — le sticker signature */}
        <section className="y2k-card p-6">
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: seuil }).map((_, i) => {
              const active = i < remplies;
              return (
                <div
                  key={i}
                  className={"y2k-slot" + (active ? " y2k-slot-on" : "")}
                  aria-label={active ? "Passage validé" : "Case vide"}
                >
                  {active ? "✦" : ""}
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-center text-sm">
            {recompensePrete ? (
              <span className="y2k-display text-base text-success">
                Récompense débloquée : {valeur} € offerts !
              </span>
            ) : (
              <>
                Encore{" "}
                <span className="y2k-display text-lg text-primary">
                  {restants}
                </span>{" "}
                passage{restants > 1 ? "s" : ""} avant ta récompense de{" "}
                <span className="font-semibold">{valeur} €</span>.
              </>
            )}
          </p>
        </section>

        {/* Code à faire scanner par Léa */}
        <section className="y2k-card p-6 text-center">
          <p className="y2k-display text-lg text-primary">Ton code</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Montre-le à Léa à chaque passage.
          </p>
          <div className="mx-auto mt-5 w-48 rounded-xl border border-border bg-white p-3">
            <div
              className="[&>svg]:h-auto [&>svg]:w-full"
              // QR généré côté serveur : contenu SVG sûr (pas d'entrée utilisateur).
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          </div>
          <div className="mt-5 break-all rounded-xl bg-muted px-4 py-2.5 font-mono text-xs tracking-wider text-muted-foreground">
            {cliente.token}
          </div>
        </section>
      </div>
    </main>
  );
}
