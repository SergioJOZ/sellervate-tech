import { isValidScore } from "../domain/score";
import type {
  ReviewRepository,
  SubmitReviewResult,
} from "../ports/review-repository";

/**
 * Spec: "Reviewing a reply requires a score, MAY include tags and a note."
 * The score is validated here too (defense in depth); the database is the
 * authoritative enforcement point (CHECK score BETWEEN 1 AND 5).
 */
export async function submitReview(
  repository: ReviewRepository,
  replyId: string,
  score: number,
  note: string | null,
  tagIds: string[],
): Promise<SubmitReviewResult> {
  if (!isValidScore(score)) {
    return {
      ok: false,
      reason: "invalid",
      message: "Select a score from 1 to 5 before saving.",
    };
  }

  return repository.submitReview(replyId, score, note, tagIds);
}
