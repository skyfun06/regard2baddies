"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LIENS = [
  { href: "/admin", label: "Accueil" },
  { href: "/admin/scan", label: "Scanner" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/reglages", label: "Réglages" },
  { href: "/admin/qr", label: "QR" },
] as const;

/**
 * Onglets de navigation admin avec indicateur de page active.
 * Client component : l'état actif dépend de l'URL courante (usePathname).
 */
export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation admin"
      className="-mb-px mt-2 flex gap-2 overflow-x-auto [scrollbar-width:none]"
    >
      {LIENS.map(({ href, label }) => {
        const actif =
          href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={actif ? "page" : undefined}
            className={
              "whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition " +
              (actif
                ? "border-primary font-semibold text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground")
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
