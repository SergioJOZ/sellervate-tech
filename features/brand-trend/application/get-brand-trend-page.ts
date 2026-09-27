import type {
  ActionImpact,
  BrandActionEntry,
  BrandSummary,
  BrandTrendRepository,
  ScoreWindow,
  SpecialistStat,
  TagCount,
  TagOption,
  WeeklyScorePoint,
} from "../ports/brand-trend-repository";
import { scoreChange, type ScoreChange } from "@/lib/score";

/**
 * A brand action numbered in chronological order (1 = oldest), so the
 * marker on the chart and its card under "What we changed" share a number.
 */
export interface NumberedAction extends BrandActionEntry {
  number: number;
  impact: ActionImpact | null;
}

/** The three summary tiles: last 4 weeks, reviewed replies, change. */
export interface BrandScoreSummary {
  last4Weeks: ScoreWindow;
  previous4Weeks: ScoreWindow;
  /** null when either window has no reviewed replies to compare. */
  change: ScoreChange | null;
}

export interface BrandTrendPageData {
  brand: BrandSummary;
  summary: BrandScoreSummary;
  weeklyScores: WeeklyScorePoint[];
  /** Chronological (oldest first). */
  actions: NumberedAction[];
  tagCounts: TagCount[];
  specialistStats: SpecialistStat[];
  tagOptions: TagOption[];
}

export type GetBrandTrendPageResult =
  { ok: true; data: BrandTrendPageData } | { ok: false; reason: "not_found" };

/**
 * Composes the read models for the brand trend page. `getBrand` returning
 * null covers both "brand does not exist" and "caller is not a member" —
 * RLS on `brands` (`is_brand_member(id)`) makes those indistinguishable by
 * design, so both surface the same designed not-found/forbidden state
 * (spec: brand-trend, "Team lead cannot view a brand she does not lead").
 */
export async function getBrandTrendPage(
  repo: BrandTrendRepository,
  brandId: string,
): Promise<GetBrandTrendPageResult> {
  const brand = await repo.getBrand(brandId);
  if (!brand) {
    return { ok: false, reason: "not_found" };
  }

  const [
    scoreWindows,
    weeklyScores,
    actions,
    impacts,
    tagCounts,
    specialistStats,
    tagOptions,
  ] = await Promise.all([
    repo.getScoreWindows(brandId),
    repo.getWeeklyScores(brandId),
    repo.getActions(brandId),
    repo.getActionImpacts(brandId),
    repo.getTagCounts(brandId),
    repo.getSpecialistStats(brandId),
    repo.getTagOptions(brandId),
  ]);

  const { last4Weeks, previous4Weeks } = scoreWindows;
  const change =
    last4Weeks.avgScore !== null && previous4Weeks.avgScore !== null
      ? scoreChange(last4Weeks.avgScore, previous4Weeks.avgScore)
      : null;

  const impactByAction = new Map(impacts.map((i) => [i.actionId, i]));

  return {
    ok: true,
    data: {
      brand,
      summary: { last4Weeks, previous4Weeks, change },
      weeklyScores,
      actions: actions.map((action, index) => ({
        ...action,
        number: index + 1,
        impact: impactByAction.get(action.id) ?? null,
      })),
      tagCounts,
      specialistStats,
      tagOptions,
    },
  };
}
