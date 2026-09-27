"use server";

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

  return submitReview(repository, replyId, score, note.trim() || null, tagIds);
}
