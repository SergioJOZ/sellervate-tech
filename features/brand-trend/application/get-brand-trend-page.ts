import type {
  BrandActionEntry,
  BrandSummary,
  BrandTrendRepository,
  SpecialistStat,
  TagCount,
  TagOption,
  WeeklyScorePoint,
} from "../ports/brand-trend-repository";

export interface BrandTrendPageData {
  brand: BrandSummary;
  weeklyScores: WeeklyScorePoint[];
  tagCounts: TagCount[];
  specialistStats: SpecialistStat[];
  actions: BrandActionEntry[];
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

  const [weeklyScores, tagCounts, specialistStats, actions, tagOptions] =
    await Promise.all([
      repo.getWeeklyScores(brandId),
      repo.getTagCounts(brandId),
      repo.getSpecialistStats(brandId),
      repo.getActions(brandId),
      repo.getTagOptions(brandId),
    ]);

  return {
    ok: true,
    data: {
      brand,
      weeklyScores,
      tagCounts,
      specialistStats,
      actions,
      tagOptions,
    },
  };
}
