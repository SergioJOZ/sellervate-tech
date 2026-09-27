import type {
  FeedbackItem,
  FeedbackRepository,
} from "../ports/feedback-repository";

export async function getFeedbackFeed(
  repo: FeedbackRepository,
): Promise<FeedbackItem[]> {
  return repo.listOwnReviewedReplies();
}
