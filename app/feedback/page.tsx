import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SupabaseAuthGateway } from "@/features/identity/infra/supabase-auth-gateway";
import { SupabaseFeedbackRepository } from "@/features/feedback/infra/supabase-feedback-repository";
import { getFeedbackFeed } from "@/features/feedback/application/get-feedback-feed";
import { getFeedbackSummary } from "@/features/feedback/application/get-feedback-summary";
import { FeedbackFeed } from "@/features/feedback/ui/FeedbackFeed";
import { FeedbackFilters } from "@/features/feedback/ui/FeedbackFilters";
import { FeedbackSummary } from "@/features/feedback/ui/FeedbackSummary";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function FeedbackPage({
  searchParams,
}: PageProps<"/feedback">) {
  const supabase = await createClient();

  // Signed out, RLS denies the query and the adapter throws; send the
  // visitor to the switcher instead of the error page.
  const claims = await new SupabaseAuthGateway(supabase).getClaims();
  if (claims.userRole === null) {
    redirect("/");
  }

  const repo = new SupabaseFeedbackRepository(supabase);
  const [summaryResult, feed] = await Promise.all([
    getFeedbackSummary(repo, new Date()),
    getFeedbackFeed(repo, await searchParams),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold text-primary">My feedback</h1>
        <p className="text-sm opacity-70">
          Your reviewed replies, with the score and note from your team lead.
        </p>
      </header>

      {feed.total === 0 ? (
        <EmptyState
          title="No feedback yet"
          description="Once a team lead reviews one of your replies, it shows up here."
        />
      ) : (
        <>
          {summaryResult.empty ? (
            <EmptyState
              title="No recent feedback"
              description="None of your replies from the last 8 weeks has been reviewed yet, so there is no summary to show. Your older feedback is below."
            />
          ) : (
            <FeedbackSummary summary={summaryResult.summary} />
          )}

          <section
            aria-label="Reviewed replies"
            className="flex flex-col gap-4"
          >
            <FeedbackFilters
              filters={feed.filters}
              brandOptions={feed.brandOptions}
              tagOptions={feed.tagOptions}
              clearHref="/feedback"
            />

            <p className="text-sm opacity-70" aria-live="polite">
              Showing {feed.items.length} of {feed.total} reviews
            </p>

            {feed.items.length === 0 ? (
              <div className="flex flex-col items-center">
                <EmptyState
                  title="No reviews match these filters"
                  description="Try a different brand, score or issue."
                />
                <Link href="/feedback" className="btn btn-ghost btn-sm">
                  Clear filters
                </Link>
              </div>
            ) : (
              <FeedbackFeed items={feed.items} />
            )}
          </section>
        </>
      )}
    </div>
  );
}
