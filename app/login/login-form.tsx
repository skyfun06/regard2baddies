"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/lib/auth-actions";

/**
 * Formulaire de connexion (admin ou cliente).
 * `useActionState` gère l'état de soumission et l'affichage des erreurs
 * renvoyées par la Server Action `login`.
 */
export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition active:scale-[0.99] disabled:opacity-60"
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>

      <p className="pt-2 text-center text-sm text-muted-foreground">
        Pas encore de carte ?{" "}
        <Link href="/inscription" className="font-medium text-primary underline">
          Créer mon compte
        </Link>
      </p>
      <p className="text-center text-xs text-muted-foreground">
        Mot de passe oublié ? Demande à Léa de le réinitialiser.
      </p>
    </form>
  );
}
