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
      <span aria-hidden className="sparkle left-[10%] top-[12%] text-2xl">
        ✦
      </span>
      <span
        aria-hidden
        className="sparkle sparkle-accent right-[8%] top-[20%] text-lg [animation-delay:0.6s]"
      >
        ✦
      </span>
      <span
        aria-hidden
        className="sparkle sparkle-primary bottom-[12%] right-[14%] text-xl [animation-delay:1.1s]"
      >
        ✦
      </span>

      <div className="w-full max-w-sm space-y-6">
        <header className="text-center">
          <h1 className="y2k-wordmark text-4xl leading-tight">
            Regard
            <br />
            2Baddies
          </h1>
          <p className="mt-4 inline-block">
            <span className="y2k-chip text-sm font-medium">
              ✦ Crée ta carte en quelques secondes ✦
            </span>
          </p>
        </header>

        <div className="y2k-card p-6">
          <InscriptionForm />
        </div>
      </div>
    </main>
  );
}
