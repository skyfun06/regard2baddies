import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";
import { logout } from "@/lib/auth-actions";
import NavLinks from "./nav-links";

/**
 * Coquille commune de l'espace admin.
 * Garde de sécurité : `requireAdmin()` redirige vers /login toute personne
 * qui n'est pas l'admin (non connectée OU cliente).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur print:hidden">
        <div className="mx-auto max-w-2xl px-4">
          <div className="flex items-center justify-between gap-4 pt-4">
            <Link href="/admin" className="flex items-baseline gap-2">
              <span className="y2k-wordmark text-base">Regard2Baddies</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Admin
              </span>
            </Link>
            <form action={logout}>
              <button className="text-xs font-medium uppercase tracking-wider text-muted-foreground transition hover:text-foreground">
                Déconnexion
              </button>
            </form>
          </div>
          <NavLinks />
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
