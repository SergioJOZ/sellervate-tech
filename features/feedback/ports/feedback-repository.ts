export interface FeedbackItem {
  replyId: string;
  brandName: string;
  sentAt: string;
  subject: string | null;
  customerMessage: string;
  body: string;
  score: number;
  note: string | null;
  reviewerName: string | null;
  tagLabels: string[];
}

/**
 * Port for the specialist's own self-view. RLS on `replies`/`reviews`
 * (specialist_id = uid) is what actually restricts rows — this port never
 * substitutes for it (spec: specialist-feedback).
 */
export interface FeedbackRepository {
  listOwnReviewedReplies(): Promise<FeedbackItem[]>;
}
