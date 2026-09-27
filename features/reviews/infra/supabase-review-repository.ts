import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  QueueReply,
  ReplyDetail,
  ReviewRepository,
  SubmitReviewResult,
  Tag,
} from "../ports/review-repository";

/**
 * Built per request from `await createClient()` in `lib/supabase/server.ts`.
 * Never construct this from a cached/module-level client — RLS must always
 * evaluate as the calling user (design.md, "Per-request adapter rule").
 *
 * Error-code mapping to `already_reviewed` / `forbidden` (A6, PG codes
 * `23505` / `42501`) happens in the Server Action that calls `submitReview`,
 * not here (per orchestrator brief for this work unit).
 */
export class SupabaseReviewRepository implements ReviewRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listQueue(brandId: string | null): Promise<QueueReply[]> {
    let query = this.supabase
      .from("review_queue")
      .select("id, brand_id, subject, customer_message, sent_at")
      .order("sent_at", { ascending: false });

    if (brandId) {
      query = query.eq("brand_id", brandId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      brandId: row.brand_id,
      subject: row.subject,
      customerMessage: row.customer_message,
      sentAt: row.sent_at,
    }));
  }

  async getReplyDetail(replyId: string): Promise<ReplyDetail | null> {
    const { data, error } = await this.supabase
      .from("replies")
      .select(
        "id, brand_id, subject, customer_message, body, sent_at, specialist_id, brands(name), profiles(display_name)",
      )
      .eq("id", replyId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const brand = Array.isArray(data.brands) ? data.brands[0] : data.brands;
    const specialist = Array.isArray(data.profiles)
      ? data.profiles[0]
      : data.profiles;

    return {
      id: data.id,
      brandId: data.brand_id,
      brandName: brand?.name ?? "",
      specialistId: data.specialist_id,
      specialistName: specialist?.display_name ?? "",
      subject: data.subject,
      customerMessage: data.customer_message,
      body: data.body,
      sentAt: data.sent_at,
    };
  }

  async listOfferableTags(brandId: string): Promise<Tag[]> {
    const { data, error } = await this.supabase
      .from("tags")
      .select("id, brand_id, slug, label")
      .or(`brand_id.is.null,brand_id.eq.${brandId}`)
      .order("label");

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      brandId: row.brand_id,
      slug: row.slug,
      label: row.label,
    }));
  }

  async listLedBrands(): Promise<{ id: string; name: string; slug: string }[]> {
    const { data, error } = await this.supabase
      .from("brands")
      .select("id, name, slug")
      .order("name");

    if (error) throw error;
    return data ?? [];
  }

  async submitReview(
    replyId: string,
    score: number,
    note: string | null,
    tagIds: string[],
  ): Promise<SubmitReviewResult> {
    const { error } = await this.supabase.rpc("submit_review", {
      p_reply_id: replyId,
      p_score: score,
      p_note: note,
      p_tag_ids: tagIds,
    });

    if (!error) return { ok: true };

    // A6: 23505 (unique reply_id) -> already reviewed; 42501 -> RLS denial.
    if (error.code === "23505") {
      return {
        ok: false,
        reason: "already_reviewed",
        message: "This reply already has a saved review.",
      };
    }
    if (error.code === "42501") {
      return {
        ok: false,
        reason: "forbidden",
        message: "You do not have permission to review this reply.",
      };
    }
    return {
      ok: false,
      reason: "invalid",
      message: error.message || "The review could not be saved.",
    };
  }
}
