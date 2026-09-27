export interface BrandSummary {
  id: string;
  name: string;
  slug: string;
}

export interface WeeklyScorePoint {
  week: string; // ISO timestamp, week start (UTC)
  avgScore: number;
  n: number;
}

export interface TagCount {
  tagId: string;
  label: string;
  last4Weeks: number;
  previous4Weeks: number;
}

export interface SpecialistStat {
  specialistId: string;
  displayName: string;
  avgScore: number;
  n: number;
  topTagLabel: string | null;
}

export interface BrandActionEntry {
  id: string;
  takenAt: string; // date
  note: string;
  tagLabel: string | null;
}

export interface TagOption {
  id: string;
  label: string;
}

export type RecordActionResult =
  { ok: true } | { ok: false; reason: "forbidden" | "invalid" };

export interface RecordActionInput {
  brandId: string;
  takenAt: string;
  note: string;
  tagId: string | null;
}

/**
 * Port for everything the brand trend page needs. The infra adapter is
 * built per request from the user-session Supabase client (design.md,
 * "Per-request adapter rule") — never a module-level singleton, never the
 * service role. RLS is the sole authorization boundary; this port never
 * substitutes for it.
 */
export interface BrandTrendRepository {
  getBrand(brandId: string): Promise<BrandSummary | null>;
  getWeeklyScores(brandId: string): Promise<WeeklyScorePoint[]>;
  getTagCounts(brandId: string): Promise<TagCount[]>;
  getSpecialistStats(brandId: string): Promise<SpecialistStat[]>;
  getActions(brandId: string): Promise<BrandActionEntry[]>;
  getTagOptions(brandId: string): Promise<TagOption[]>;
  recordAction(input: RecordActionInput): Promise<RecordActionResult>;
}
