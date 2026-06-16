import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client (anon key).
 * Used only for auth/session on the admin side. Patients never write to
 * Supabase directly — survey submission goes through /api/submit.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
