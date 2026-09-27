"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SupabaseReviewRepository } from "@/features/reviews/infra/supabase-review-repository";
import { submitReview } from "@/features/reviews/application/submit-review";
import type { SubmitReviewResult } from "@/features/reviews/ports/review-repository";

/**
 * Composition root for saving a review (A5: writes in Server Actions,
 * per-request adapter). `submitReview` calls `submit_review` (A6); the
 * repository maps `23505`/`42501` to `already_reviewed`/`forbidden`.
 */
export async function submitReviewAction(
  replyId: string,
  score: number,
  note: string,
  tagIds: string[],
): Promise<SubmitReviewResult> {
  const supabase = await createClient();
  const repository = new SupabaseReviewRepository(supabase);

  const result = await submitReview(
    repository,
    replyId,
    score,
    note.trim() || null,
    tagIds,
  );

  // The queue list lives in app/queue/layout.tsx, and layouts are not
  // re-rendered when navigating between their children. Without this, the
  // reviewed reply would stay in the list after "Save & next".
  if (result.ok) {
    revalidatePath("/queue", "layout");
  }

  return result;
}
