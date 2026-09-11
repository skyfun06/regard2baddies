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
      <div className="w-full max-w-sm space-y-8">
        {/* Wordmark — la signature */}
        <header className="text-center">
          <h1 className="y2k-wordmark text-4xl leading-tight">
            Regard
            <br />
            2Baddies
          </h1>
          <p className="mt-4 text-sm tracking-wide text-muted-foreground">
            Ta carte de fidélité
          </p>
        </header>

        <div className="y2k-card p-7">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
