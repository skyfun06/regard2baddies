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
      <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
        <nav className="mx-auto flex max-w-2xl items-center gap-4 p-4 text-sm">
          <Link href="/admin" className="font-semibold text-primary">
            Admin
          </Link>
          <Link href="/admin/scan" className="text-muted-foreground">
            Scanner
          </Link>
          <Link href="/admin/clientes" className="text-muted-foreground">
            Clientes
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
