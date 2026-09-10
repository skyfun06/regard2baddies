import { headers } from "next/headers";
import QRCode from "qrcode";
import { requireAdmin } from "@/lib/supabase/auth";
import PrintButton from "./print-button";

/**
 * QR fixe de Léa (Partie 3). Il encode l'URL publique d'inscription : une
 * nouvelle cliente le scanne pour créer sa carte. Fixe = il ne change jamais,
 * donc imprimable une fois et affiché au comptoir.
 */
export default async function QrPage() {
  await requireAdmin();

  // URL absolue d'inscription. On préfère NEXT_PUBLIC_SITE_URL si défini
  // (stable), sinon on la reconstruit depuis les en-têtes de la requête.
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  let url: string;
  if (base) {
    url = `${base}/inscription`;
  } else {
    const h = await headers();
    const host = h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? "https";
    url = `${proto}://${host}/inscription`;
  }

  const qrSvg = await QRCode.toString(url, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#3b0f33", light: "#ffffff" },
  });

  return (
    <section className="space-y-5">
      <div className="flex items-baseline justify-between gap-3 print:hidden">
        <h1 className="y2k-display text-2xl text-primary">QR d&apos;inscription</h1>
        <PrintButton />
      </div>
      <p className="text-sm text-muted-foreground print:hidden">
        À imprimer et afficher au salon. Les clientes le scannent pour créer
        leur carte de fidélité.
      </p>

      {/* Carte imprimable : centrée et sobre pour le papier. */}
      <div className="y2k-card mx-auto max-w-xs p-8 text-center print:border-0 print:shadow-none">
        <p className="y2k-wordmark text-2xl">Regard2Baddies</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Scanne-moi pour ta carte de fidélité
        </p>
        <div
          className="mx-auto mt-6 w-56 [&>svg]:h-auto [&>svg]:w-full"
          // QR généré côté serveur : contenu SVG sûr (pas d'entrée utilisateur).
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <p className="mt-6 break-all text-xs text-muted-foreground">{url}</p>
      </div>
    </section>
  );
}
