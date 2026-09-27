import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BrandActionEntry,
  BrandSummary,
  BrandTrendRepository,
  RecordActionInput,
  RecordActionResult,
  SpecialistStat,
  TagCount,
  TagOption,
  WeeklyScorePoint,
} from "../ports/brand-trend-repository";

/**
 * Built per request from `await createClient()` in `lib/supabase/server.ts`.
 * Every query runs as `authenticated` with the caller's JWT; RLS on the
 * underlying tables (and `security_invoker` on the views) is the only
 * authorization boundary — this adapter never widens or narrows it.
 */
export class SupabaseBrandTrendRepository implements BrandTrendRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getBrand(brandId: string): Promise<BrandSummary | null> {
    const { data } = await this.supabase
      .from("brands")
      .select("id, name, slug")
      .eq("id", brandId)
      .maybeSingle();
    return data ?? null;
  }

  async getWeeklyScores(brandId: string): Promise<WeeklyScorePoint[]> {
    const { data } = await this.supabase
      .from("brand_weekly_scores")
      .select("week, avg_score, n")
      .eq("brand_id", brandId)
      .order("week", { ascending: true });

    return (data ?? []).map((row) => ({
      week: row.week as string,
      avgScore: Number(row.avg_score),
      n: Number(row.n),
    }));
  }

  async getTagCounts(brandId: string): Promise<TagCount[]> {
    const { data } = await this.supabase
      .from("brand_tag_counts")
      .select("tag_id, label, last_4_weeks, previous_4_weeks")
      .eq("brand_id", brandId)
      .order("last_4_weeks", { ascending: false })
      .order("label", { ascending: true });

    return (data ?? []).map((row) => ({
      tagId: row.tag_id as string,
      label: row.label as string,
      last4Weeks: Number(row.last_4_weeks),
      previous4Weeks: Number(row.previous_4_weeks),
    }));
  }

  async getSpecialistStats(brandId: string): Promise<SpecialistStat[]> {
    const { data } = await this.supabase
      .from("brand_specialist_stats")
      .select("specialist_id, avg_score, n, top_tag")
      .eq("brand_id", brandId)
      .order("avg_score", { ascending: false });

    const rows = data ?? [];
    if (rows.length === 0) return [];

    const specialistIds = [
      ...new Set(rows.map((r) => r.specialist_id as string)),
    ];
    const tagIds = [
      ...new Set(
        rows
          .map((r) => r.top_tag as string | null)
          .filter((id): id is string => id !== null),
      ),
    ];

    const [{ data: profiles }, { data: tags }] = await Promise.all([
      this.supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", specialistIds),
      tagIds.length > 0
        ? this.supabase.from("tags").select("id, label").in("id", tagIds)
        : Promise.resolve({ data: [] as { id: string; label: string }[] }),
    ]);

    const nameById = new Map(
      (profiles ?? []).map((p) => [p.id, p.display_name]),
    );
    const tagLabelById = new Map((tags ?? []).map((t) => [t.id, t.label]));

    return rows.map((row) => ({
      specialistId: row.specialist_id as string,
      displayName: nameById.get(row.specialist_id as string) ?? "Unknown",
      avgScore: Number(row.avg_score),
      n: Number(row.n),
      topTagLabel: row.top_tag
        ? (tagLabelById.get(row.top_tag as string) ?? null)
        : null,
    }));
  }

  async getActions(brandId: string): Promise<BrandActionEntry[]> {
    const { data } = await this.supabase
      .from("brand_actions")
      .select("id, taken_at, note, tag:tags(label)")
      .eq("brand_id", brandId)
      .order("taken_at", { ascending: true });

    return (data ?? []).map((row) => ({
      id: row.id as string,
      takenAt: row.taken_at as string,
      note: row.note as string,
      tagLabel: (row.tag as unknown as { label: string } | null)?.label ?? null,
    }));
  }

  async getTagOptions(brandId: string): Promise<TagOption[]> {
    const { data } = await this.supabase
      .from("tags")
      .select("id, label")
      .or(`brand_id.is.null,brand_id.eq.${brandId}`)
      .order("label", { ascending: true });

    return (data ?? []).map((row) => ({ id: row.id, label: row.label }));
  }

  async recordAction(input: RecordActionInput): Promise<RecordActionResult> {
    const { error } = await this.supabase.from("brand_actions").insert({
      brand_id: input.brandId,
      taken_at: input.takenAt,
      note: input.note,
      tag_id: input.tagId,
    });

    if (!error) return { ok: true };
    if (error.code === "42501") return { ok: false, reason: "forbidden" };
    return { ok: false, reason: "invalid" };
  }
}
