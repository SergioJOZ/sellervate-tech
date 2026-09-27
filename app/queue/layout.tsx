import { createClient } from "@/lib/supabase/server";
import { SupabaseReviewRepository } from "@/features/reviews/infra/supabase-review-repository";
import { listQueue } from "@/features/reviews/application/list-queue";
import { QueueList } from "@/features/reviews/ui/QueueList";

/**
 * Split pane (design.md A21): the queue list here, the selected reply (or
 * the empty state) in the child slot. Reads the full `review_queue` for
 * the current lead's brands; the brand filter narrows client-side in
 * `QueueList` via `useSearchParams`.
 */
export default async function QueueLayout({ children }: LayoutProps<"/queue">) {
  const supabase = await createClient();
  const repository = new SupabaseReviewRepository(supabase);

  const [replies, brands] = await Promise.all([
    listQueue(repository, null),
    repository.listLedBrands(),
  ]);

  return (
    <div className="flex flex-1">
      <aside className="w-80 shrink-0 border-r border-base-300">
        <QueueList replies={replies} brands={brands} />
      </aside>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
