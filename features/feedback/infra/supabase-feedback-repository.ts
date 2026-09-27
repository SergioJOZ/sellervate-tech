import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  FeedbackItem,
  FeedbackRepository,
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
    brand: { name: string } | null;
  } | null;
  review_tags: { tag: { label: string } | null }[] | null;
}

/**
 * Built per request from `await createClient()` in `lib/supabase/server.ts`.
 * RLS restricts `reviews`/`replies` rows to the caller's own reviewed
 * replies (specialist_id = uid) — this adapter relies on that, it never
 * filters by user id itself (design.md, RLS is the sole authority).
 */
export class SupabaseFeedbackRepository implements FeedbackRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listOwnReviewedReplies(): Promise<FeedbackItem[]> {
    const { data } = await this.supabase.from("reviews").select(
      `score, note,
         reviewer:profiles(display_name),
         reply:replies!inner(id, subject, customer_message, body, sent_at, brand:brands(name)),
         review_tags(tag:tags(label))`,
    );

    const rows = (data ?? []) as unknown as ReviewRow[];

    const items: FeedbackItem[] = rows
      .filter((row) => row.reply !== null)
      .map((row) => ({
        replyId: row.reply!.id,
        brandName: row.reply!.brand?.name ?? "Unknown brand",
        sentAt: row.reply!.sent_at,
        subject: row.reply!.subject,
        customerMessage: row.reply!.customer_message,
        body: row.reply!.body,
        score: Number(row.score),
        note: row.note,
        reviewerName: row.reviewer?.display_name ?? null,
        tagLabels: (row.review_tags ?? [])
          .map((rt) => rt.tag?.label)
          .filter((label): label is string => Boolean(label)),
      }));

    items.sort(
      (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
    );

    return items;
  }
}
