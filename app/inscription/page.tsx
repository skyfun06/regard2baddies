import { redirect } from "next/navigation";
import { getRole } from "@/lib/supabase/auth";
import InscriptionForm from "./inscription-form";

/**
 * Inscription publique d'une cliente — page cible du QR fixe de Léa.
 * Si l'utilisateur est déjà connecté, on le renvoie vers son espace.
 */
export default async function InscriptionPage() {
  const role = await getRole();
  if (role === "admin") redirect("/admin");
  if (role === "cliente") redirect("/carte");

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-center text-xl font-semibold text-primary">
          Bienvenue chez Regard2Baddies
        </h1>
        <p className="mb-6 mt-1 text-center text-sm text-muted-foreground">
          Crée ta carte de fidélité en quelques secondes
        </p>
        <InscriptionForm />
      </div>
    </main>
  );
}
