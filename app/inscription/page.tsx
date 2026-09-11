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
    <main className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
      <div className="w-full max-w-sm space-y-6">
        <header className="text-center">
          <h1 className="y2k-wordmark text-4xl leading-tight">
            Regard
            <br />
            2Baddies
          </h1>
          <p className="mt-4 text-sm tracking-wide text-muted-foreground">
            Crée ta carte en quelques secondes
          </p>
        </header>

        <div className="y2k-card p-6">
          <InscriptionForm />
        </div>
      </div>
    </main>
  );
}
