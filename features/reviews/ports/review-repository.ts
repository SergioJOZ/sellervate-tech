export interface QueueReply {
  id: string;
  brandId: string;
  subject: string | null;
  customerMessage: string;
  sentAt: string;
}

export interface Tag {
  id: string;
  brandId: string | null;
  slug: string;
  label: string;
}

export interface ReplyDetail {
  id: string;
  brandId: string;
  brandName: string;
  specialistId: string;
  specialistName: string;
  subject: string | null;
  customerMessage: string;
  body: string;
  sentAt: string;
}

export type SubmitReviewErrorReason =
  "already_reviewed" | "forbidden" | "invalid";

export interface SubmitReviewResult {
  ok: boolean;
  reason?: SubmitReviewErrorReason;
  message?: string;
}

export type CreateBrandTagErrorReason = "duplicate" | "forbidden" | "invalid";

export type CreateBrandTagResult =
  | { ok: true; tag: Tag }
  | { ok: false; reason: CreateBrandTagErrorReason; message?: string };

/**
 * Port for the review-loop data access. The infra adapter is built per
 * request from the user-session Supabase client (design.md, "Per-request
 * adapter rule") — never a module-level singleton, never the service role.
 */
export interface ReviewRepository {
  listQueue(brandId: string | null): Promise<QueueReply[]>;
  getReplyDetail(replyId: string): Promise<ReplyDetail | null>;
  listOfferableTags(brandId: string): Promise<Tag[]>;
  submitReview(
    replyId: string,
    score: number,
    note: string | null,
    tagIds: string[],
  ): Promise<SubmitReviewResult>;
  /** Inserts a tag scoped to `brandId` (never global). */
  createBrandTag(
    brandId: string,
    slug: string,
    label: string,
    description: string | null,
  ): Promise<CreateBrandTagResult>;
  listLedBrands(): Promise<{ id: string; name: string; slug: string }[]>;
}
