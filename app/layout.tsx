import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
 * `data-theme` fixe la palette active (voir app/themes.css).
 * Valeur par défaut "rose" ; plus tard, on la lira depuis reglages.theme_actif.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      data-theme="rose"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
