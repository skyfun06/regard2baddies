import { redirect } from "next/navigation";
import { getRole } from "@/lib/supabase/auth";
import LoginForm from "./login-form";

/**
 * Page de connexion. Si l'utilisateur est déjà connecté, on le renvoie vers
 * son espace (admin ou carte) plutôt que d'afficher le formulaire.
 */
export default async function LoginPage() {
  const role = await getRole();
  if (role === "admin") redirect("/admin");
  if (role === "cliente") redirect("/carte");

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
      {/* Étoiles décoratives autour du bloc central */}
      <span aria-hidden className="sparkle left-[8%] top-[14%] text-2xl">
        ✦
      </span>
      <span
        aria-hidden
        className="sparkle sparkle-accent right-[10%] top-[24%] text-lg [animation-delay:0.7s]"
      >
        ✦
      </span>
      <span
        aria-hidden
        className="sparkle sparkle-primary bottom-[16%] left-[14%] text-xl [animation-delay:1.3s]"
      >
        ✦
      </span>
      <span
        aria-hidden
        className="sparkle bottom-[10%] right-[16%] text-sm [animation-delay:0.4s]"
      >
        ✦
      </span>

      <div className="w-full max-w-sm space-y-6">
        {/* Wordmark chrome — la signature Y2K */}
        <header className="text-center">
          <h1 className="y2k-wordmark text-4xl leading-tight">
            Regard
            <br />
            2Baddies
          </h1>
          <p className="mt-4 inline-block">
            <span className="y2k-chip text-sm font-medium">
              ✦ Ta carte de fidélité ✦
            </span>
          </p>
        </header>

        <div className="y2k-card p-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
