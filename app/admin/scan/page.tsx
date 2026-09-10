import { requireAdmin } from "@/lib/supabase/auth";
import Scanner from "./scanner";

/**
 * Page scanner (admin). La caméra et l'enregistrement des passages sont gérés
 * par le composant client <Scanner /> ; ici on garantit seulement l'accès admin.
 */
export default async function ScanPage() {
  await requireAdmin();
  return <Scanner />;
}
