import { createClient } from "@/lib/supabase/server";

/**
 * Minimal placeholder — the specialist feedback feed lands in PR 6. This
 * page only proves the post-switch redirect for specialists.
 */
export default async function FeedbackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <p className="text-lg">
        Signed in as {user?.email ?? "unknown"} · specialist.
      </p>
      <p className="text-sm opacity-70">
        Your feedback view lands in a later PR.
      </p>
    </div>
  );
}
