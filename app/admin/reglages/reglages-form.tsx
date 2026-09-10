"use client";

import { useActionState } from "react";
import { updateReglages } from "@/lib/admin-actions";

/** Thèmes disponibles (doit rester aligné avec THEMES dans lib/admin-actions). */
const THEMES: { value: string; label: string }[] = [
  { value: "rose", label: "Rose" },
  { value: "violet", label: "Violet" },
  { value: "jaune", label: "Jaune" },
  { value: "bleu", label: "Bleu" },
  { value: "noel", label: "Noël" },
  { value: "halloween", label: "Halloween" },
  { value: "printemps", label: "Printemps" },
  { value: "ete", label: "Été" },
];

export default function ReglagesForm({
  seuil,
  valeur,
  theme,
}: {
  seuil: number;
  valeur: number;
  theme: string;
}) {
  const [state, action, pending] = useActionState(updateReglages, undefined);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-1">
        <label htmlFor="seuil_passages" className="text-sm font-medium">
          Seuil de passages
        </label>
        <p className="text-xs text-muted-foreground">
          Nombre de passages pour débloquer une récompense.
        </p>
        <input
          id="seuil_passages"
          name="seuil_passages"
          type="number"
          min={1}
          step={1}
          required
          defaultValue={seuil}
          className="y2k-input text-base"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="valeur_recompense" className="text-sm font-medium">
          Valeur de la récompense (€)
        </label>
        <input
          id="valeur_recompense"
          name="valeur_recompense"
          type="number"
          min={0}
          step={1}
          required
          defaultValue={valeur}
          className="y2k-input text-base"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="theme_actif" className="text-sm font-medium">
          Thème saisonnier
        </label>
        <p className="text-xs text-muted-foreground">
          Change les couleurs de toute l&apos;application.
        </p>
        <select
          id="theme_actif"
          name="theme_actif"
          defaultValue={theme}
          className="y2k-input text-base"
        >
          {THEMES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {state?.ok === false && (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok === true && (
        <p className="text-sm text-success">Réglages enregistrés.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="y2k-btn w-full px-4 py-3 text-lg"
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
