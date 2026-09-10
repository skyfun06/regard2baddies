import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Regard2Baddies — Carte de fidélité",
  description: "Votre carte de fidélité digitale",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Regard2Baddies",
  },
};

// Config mobile d'abord : plein écran, pas de zoom involontaire.
// `themeColor` colore la barre du navigateur/PWA.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#e84f8a",
};

/**
 * `data-theme` fixe la palette active (voir app/themes.css). La valeur vient de
 * reglages.theme_actif via la fonction get_theme() (lisible par tous, thème
 * saisonnier appliqué à TOUTE l'app). "rose" par défaut si indisponible.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  let theme = "rose";
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_theme");
    if (typeof data === "string" && data) theme = data;
  } catch {
    // base indisponible : on garde le thème par défaut.
  }

  return (
    <html
      lang="fr"
      data-theme={theme}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
