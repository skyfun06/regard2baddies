import Link from "next/link";

/**
 * Coquille commune de l'espace admin.
 * (Placeholder : la protection par authentification sera ajoutée plus tard.)
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        </nav>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 p-4">{children}</main>
    </div>
  );
}
