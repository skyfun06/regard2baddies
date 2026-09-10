import { redirect } from "next/navigation";
import { getRole } from "@/lib/supabase/auth";

/**
 * Racine `/` : simple aiguillage selon le rôle.
 *  - admin   -> /admin
 *  - cliente -> /carte
 *  - anonyme -> /login
 */
export default async function Home() {
  const role = await getRole();
  if (role === "admin") redirect("/admin");
  if (role === "cliente") redirect("/carte");
  redirect("/login");
}
