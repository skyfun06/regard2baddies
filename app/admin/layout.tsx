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
      <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur print:hidden">
        <nav className="mx-auto flex max-w-2xl flex-wrap items-center gap-x-4 gap-y-2 p-4 text-sm">
          <Link href="/admin" className="font-semibold text-primary">
            Admin
          </Link>
          <Link href="/admin/scan" className="text-muted-foreground">
            Scanner
          </Link>
          <Link href="/admin/clientes" className="text-muted-foreground">
            Clientes
          </Link>
          <Link href="/admin/reglages" className="text-muted-foreground">
            Réglages
          </Link>
          <Link href="/admin/qr" className="text-muted-foreground">
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
