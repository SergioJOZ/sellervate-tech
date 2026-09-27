import { createClient } from "@/lib/supabase/server";
import { SupabaseFeedbackRepository } from "@/features/feedback/infra/supabase-feedback-repository";
import { getFeedbackFeed } from "@/features/feedback/application/get-feedback-feed";
import { FeedbackFeed } from "@/features/feedback/ui/FeedbackFeed";
import { EmptyState } from "@/features/feedback/ui/EmptyState";

export default async function FeedbackPage() {
  const supabase = await createClient();
  const repo = new SupabaseFeedbackRepository(supabase);
  const items = await getFeedbackFeed(repo);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold text-primary">My feedback</h1>
        <p className="text-sm opacity-70">
          Your reviewed replies, with the score and note from your team lead.
        </p>
      </header>

      {items.length === 0 ? <EmptyState /> : <FeedbackFeed items={items} />}
    </div>
  );
}
