import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";
import { logout } from "@/lib/auth-actions";

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
      <header className="sticky top-0 z-10 border-b-2 border-white bg-surface/85 backdrop-blur print:hidden">
        <nav className="mx-auto flex max-w-2xl flex-wrap items-center gap-x-3 gap-y-2 p-4 text-sm">
          <Link href="/admin" className="y2k-display text-lg text-primary">
            Admin ✦
          </Link>
          <Link
            href="/admin/scan"
            className="y2k-chip text-muted-foreground transition hover:text-primary"
          >
            Scanner
          </Link>
          <Link
            href="/admin/clientes"
            className="y2k-chip text-muted-foreground transition hover:text-primary"
          >
            Clientes
          </Link>
          <Link
            href="/admin/reglages"
            className="y2k-chip text-muted-foreground transition hover:text-primary"
          >
            Réglages
          </Link>
          <Link
            href="/admin/qr"
            className="y2k-chip text-muted-foreground transition hover:text-primary"
          >
            QR
          </Link>
          <form action={logout} className="ml-auto">
            <button className="text-muted-foreground underline">
              Déconnexion
            </button>
          </form>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 p-4">{children}</main>
    </div>
  );
}
