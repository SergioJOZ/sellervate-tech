export interface FeedbackTag {
  id: string;
  label: string;
}

export interface FeedbackItem {
  replyId: string;
  brandId: string;
  brandName: string;
  sentAt: string;
  subject: string | null;
  customerMessage: string;
  body: string;
  score: number;
  note: string | null;
  reviewerName: string | null;
  tags: FeedbackTag[];
}

/**
 * Port for the specialist's own self-view. RLS on `replies`/`reviews`
 * (specialist_id = uid) is what actually restricts rows — this port never
 * substitutes for it (spec: specialist-feedback).
 */
export interface FeedbackRepository {
  /** Every reviewed reply the caller authored, newest first by `sent_at`. */
  listOwnReviewedReplies(): Promise<FeedbackItem[]>;
}
