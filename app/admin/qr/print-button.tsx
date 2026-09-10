"use client";

/** Bouton d'impression du QR (déclenche la boîte d'impression du navigateur). */
export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
    >
      Imprimer
    </button>
  );
}
