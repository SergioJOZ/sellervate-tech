"use server";

import { refresh, revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SupabaseReviewRepository } from "@/features/reviews/infra/supabase-review-repository";
import { submitReview } from "@/features/reviews/application/submit-review";
import { createBrandTag } from "@/features/reviews/application/create-brand-tag";
import type {
  CreateBrandTagResult,
  SubmitReviewResult,
} from "@/features/reviews/ports/review-repository";

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

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Composition root for creating a brand tag from the review form. Only the
 * reply id crosses the boundary as a reference: the brand is looked up from
 * that reply through RLS, never taken from the client (A5, per-request
 * adapter). The repository maps `23505`/`42501` to `duplicate`/`forbidden`.
 */
export async function createBrandTagAction(
  replyId: string,
  label: string,
  description: string,
): Promise<CreateBrandTagResult> {
  if (
    typeof replyId !== "string" ||
    !UUID_PATTERN.test(replyId) ||
    typeof label !== "string" ||
    typeof description !== "string"
  ) {
    return {
      ok: false,
      reason: "invalid",
      message: "The tag could not be created.",
    };
  }

  const supabase = await createClient();
  const repository = new SupabaseReviewRepository(supabase);

  const result = await createBrandTag(repository, replyId, label, description);

  // Re-render the reply page so the server-read tag list includes the new
  // tag; the client form keeps its score, note and selection meanwhile.
  if (result.ok) {
    refresh();
  }

  return result;
}
