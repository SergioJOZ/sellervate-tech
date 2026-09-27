import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Builds a Supabase client bound to the current request's session cookies.
 *
 * MUST be constructed fresh per request (Server Component or Server Action).
 * Never hoist the result to a module-level singleton and never use the
 * service role key here — PostgREST must always run as `authenticated` with
 * the calling user's JWT so RLS applies (design.md, "Per-request adapter
 * rule").
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component during render — the proxy
            // refreshes the session, so this can be safely ignored.
          }
        },
      },
    },
  );
}
