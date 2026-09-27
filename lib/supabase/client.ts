import { createBrowserClient } from "@supabase/ssr";

/**
 * Builds a Supabase client for use in Client Components. Session state is
 * read from/written to cookies so the server and browser share one session.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
