import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SupabaseReviewRepository } from "@/features/reviews/infra/supabase-review-repository";
import { getReplyWithTags } from "@/features/reviews/application/get-reply";
import { listQueue } from "@/features/reviews/application/list-queue";
import { ReplyView } from "@/features/reviews/ui/ReplyView";
import { ReviewForm } from "@/features/reviews/ui/ReviewForm";
import { createBrandTagAction, submitReviewAction } from "./actions";

export default async function ReplyPage({
  params,
  searchParams,
}: PageProps<"/queue/[replyId]">) {
  const { replyId } = await params;
  const { brand } = await searchParams;
  const brandFilter = typeof brand === "string" ? brand : null;

  const supabase = await createClient();
  const repository = new SupabaseReviewRepository(supabase);

  const [result, queue] = await Promise.all([
    getReplyWithTags(repository, replyId),
    listQueue(repository, brandFilter),
  ]);

  if (!result) {
    notFound();
  }

  const { reply, offerableTags } = result;

  const remaining = queue.filter((r) => r.id !== replyId);
  const nextQueueReplyId = remaining[0]?.id ?? null;

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
      <ReplyView reply={reply} />
      <ReviewForm
        replyId={reply.id}
        brandName={reply.brandName}
        offerableTags={offerableTags}
        nextQueueReplyId={nextQueueReplyId}
        brandFilter={brandFilter}
        submitReviewAction={submitReviewAction}
        createBrandTagAction={createBrandTagAction}
      />
    </div>
  );
}
