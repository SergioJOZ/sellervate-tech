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
  authorName: string;
}

/** Average score and reviewed-reply count over one window. */
export interface ScoreWindow {
  avgScore: number | null; // null when the window has no reviewed replies
  n: number;
}

/** Last 4 weeks vs the 4 weeks before, by reply `sent_at`. */
export interface ScoreWindows {
  last4Weeks: ScoreWindow;
  previous4Weeks: ScoreWindow;
}

export interface ImpactWindow extends ScoreWindow {
  tagCount: number | null; // null when the action targets no tag
}

/** 4 weeks before vs 4 weeks after one brand action (`brand_action_impact`). */
export interface ActionImpact {
  actionId: string;
  before: ImpactWindow;
  after: ImpactWindow;
  weeksAfter: number; // whole weeks of data after the action, capped at 4
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
  getScoreWindows(brandId: string): Promise<ScoreWindows>;
  getTagCounts(brandId: string): Promise<TagCount[]>;
  getSpecialistStats(brandId: string): Promise<SpecialistStat[]>;
  getActions(brandId: string): Promise<BrandActionEntry[]>;
  getActionImpacts(brandId: string): Promise<ActionImpact[]>;
  getTagOptions(brandId: string): Promise<TagOption[]>;
  recordAction(input: RecordActionInput): Promise<RecordActionResult>;
}
