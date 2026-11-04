import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Le stockage privé Supabase n’est pas configuré pour cet environnement.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const STUDIO_DELIVERABLES_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "studio-deliverables";
