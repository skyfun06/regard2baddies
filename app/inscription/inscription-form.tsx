"use client";

import Link from "next/link";
import { useActionState } from "react";
import { inscription } from "@/lib/auth-actions";

/**
 * Formulaire d'inscription publique d'une cliente (atteint via le QR de Léa).
 * Email obligatoire ; il ne sert qu'à la récupération d'accès via Léa
 * (pas de flux "mot de passe oublié" automatique côté cliente pour l'instant).
 */
export default function InscriptionForm() {
  const [state, action, pending] = useActionState(inscription, undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="prenom" className="text-sm font-medium">
          Prénom
        </label>
        <input
          id="prenom"
          name="prenom"
          type="text"
          autoComplete="given-name"
          required
          className="y2k-input text-base"
        />
      </div>

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
          className="y2k-input text-base"
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
          autoComplete="new-password"
          required
          minLength={8}
          className="y2k-input text-base"
        />
        <p className="text-xs text-muted-foreground">8 caractères minimum.</p>
      </div>

      {state?.error && (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="y2k-btn w-full px-4 py-3 text-lg"
      >
        {pending ? "Création…" : "Créer ma carte"}
      </button>

      <p className="pt-2 text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-primary underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
