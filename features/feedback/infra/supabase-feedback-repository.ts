import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  FeedbackItem,
  FeedbackRepository,
  FeedbackTag,
} from "../ports/feedback-repository";

interface ReviewRow {
  score: number;
  note: string | null;
  reviewer: { display_name: string } | null;
  reply: {
    id: string;
    subject: string | null;
    customer_message: string;
    body: string;
    sent_at: string;
    brand: { id: string; name: string } | null;
  } | null;
  review_tags: { tag: FeedbackTag | null }[] | null;
}

/**
 * Built per request from `await createClient()` in `lib/supabase/server.ts`.
 * RLS restricts `reviews`/`replies` rows to the caller's own reviewed
 * replies (specialist_id = uid) — this adapter relies on that, it never
 * filters by user id itself (design.md, RLS is the sole authority).
 *
 * The summary and the feed read the same rows, so the query result is
 * memoised on the instance. That is safe only because an instance lives for
 * a single request (per-request adapter rule) — never share one.
 */
export class SupabaseFeedbackRepository implements FeedbackRepository {
  private ownReviewedReplies: Promise<FeedbackItem[]> | null = null;

  constructor(private readonly supabase: SupabaseClient) {}

  listOwnReviewedReplies(): Promise<FeedbackItem[]> {
    this.ownReviewedReplies ??= this.fetchOwnReviewedReplies();
    return this.ownReviewedReplies;
  }

  private async fetchOwnReviewedReplies(): Promise<FeedbackItem[]> {
    const { data } = await this.supabase.from("reviews").select(
      `score, note,
         reviewer:profiles(display_name),
         reply:replies!inner(id, subject, customer_message, body, sent_at, brand:brands(id, name)),
         review_tags(tag:tags(id, label))`,
    );

    const rows = (data ?? []) as unknown as ReviewRow[];

    const items: FeedbackItem[] = rows
      .filter((row) => row.reply !== null)
      .map((row) => ({
        replyId: row.reply!.id,
        brandId: row.reply!.brand?.id ?? "",
        brandName: row.reply!.brand?.name ?? "Unknown brand",
        sentAt: row.reply!.sent_at,
        subject: row.reply!.subject,
        customerMessage: row.reply!.customer_message,
        body: row.reply!.body,
        score: Number(row.score),
        note: row.note,
        reviewerName: row.reviewer?.display_name ?? null,
        tags: (row.review_tags ?? [])
          .map((rt) => rt.tag)
          .filter((tag): tag is FeedbackTag => tag !== null),
      }));

    items.sort(
      (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
    );

    return items;
  }
}
