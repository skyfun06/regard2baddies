"use client";

/** Bouton d'impression du QR (déclenche la boîte d'impression du navigateur). */
export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="y2k-btn px-4 py-2 text-sm"
    >
      Imprimer
    </button>
  );
}
