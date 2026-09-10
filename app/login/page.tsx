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
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-center text-xl font-semibold text-primary">
          Regard2Baddies
        </h1>
        <p className="mb-6 mt-1 text-center text-sm text-muted-foreground">
          Connecte-toi à ta carte de fidélité
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
