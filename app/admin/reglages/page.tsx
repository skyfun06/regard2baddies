import { requireAdmin } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import ReglagesForm from "./reglages-form";

/**
 * Réglages de la boutique (Partie 3) : seuil de passages, valeur de la
 * récompense et thème saisonnier. Le formulaire est un composant client
 * (useActionState) ; ici on charge les valeurs courantes.
 */
export default async function ReglagesPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: reglages } = await supabase
    .from("reglages")
    .select("seuil_passages, valeur_recompense, theme_actif")
    .maybeSingle();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="y2k-display text-2xl text-primary">Réglages</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ces valeurs s&apos;appliquent à toutes les cartes.
        </p>
      </div>
      <ReglagesForm
        seuil={reglages?.seuil_passages ?? 5}
        valeur={reglages?.valeur_recompense ?? 20}
        theme={reglages?.theme_actif ?? "rose"}
      />
    </section>
  );
}
