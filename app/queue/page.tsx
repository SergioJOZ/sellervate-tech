import { createClient } from "@/lib/supabase/server";
import { SupabaseAuthGateway } from "@/features/identity/infra/supabase-auth-gateway";

/**
 * Minimal placeholder — the review queue lands in PR 5. This page only
 * proves the post-switch redirect for team leads; it does not query
 * `review_queue` yet.
 */
export default async function QueuePage() {
  const supabase = await createClient();
  const gateway = new SupabaseAuthGateway(supabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await gateway.getClaims();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <p className="text-lg">
        Signed in as {user?.email ?? "unknown"} · team lead.
      </p>
      <p className="text-sm opacity-70">
        The review queue lands in the next PR.
      </p>
    </div>
  );
}
