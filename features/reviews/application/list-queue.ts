import type { QueueReply, ReviewRepository } from "../ports/review-repository";

/**
 * Spec: "Review queue lists unreviewed replies for led brands" — the
 * `review_queue` view already restricts rows to unreviewed replies in the
 * caller's led brands and orders them newest first; the optional
 * `brandId` filter narrows within those brands.
 */
export async function listQueue(
  repository: ReviewRepository,
  brandId: string | null,
): Promise<QueueReply[]> {
  return repository.listQueue(brandId);
}
