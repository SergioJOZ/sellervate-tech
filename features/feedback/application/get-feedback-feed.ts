import type {
  FeedbackItem,
  FeedbackRepository,
} from "../ports/feedback-repository";
import { isScoreBand, scoreInBand, type ScoreBand } from "../domain/score-band";

/** Raw URL search params, as a Next.js page receives them. */
export type RawFeedbackParams = Record<string, string | string[] | undefined>;

export interface FeedbackFilters {
  brandId: string | null;
  scoreBand: ScoreBand | null;
  tagId: string | null;
}

export interface FilterOption {
  id: string;
  label: string;
}

export interface FeedbackFeed {
  /** Filtered items, newest first. */
  items: FeedbackItem[];
  /** All of the specialist's reviewed replies, before filtering. */
  total: number;
  /** The filters actually applied — unknown or invalid values dropped. */
  filters: FeedbackFilters;
  /** Only brands and tags that appear in the specialist's own feedback. */
  brandOptions: FilterOption[];
  tagOptions: FilterOption[];
}

function single(value: string | string[] | undefined): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

function byLabel(a: FilterOption, b: FilterOption) {
  return a.label.localeCompare(b.label);
}

function optionsFrom(items: FeedbackItem[]) {
  const brands = new Map<string, string>();
  const tags = new Map<string, string>();
  for (const item of items) {
    // A brand the caller can no longer read has no id to filter by.
    if (item.brandId !== "") brands.set(item.brandId, item.brandName);
    for (const tag of item.tags) tags.set(tag.id, tag.label);
  }
  const toOptions = (map: Map<string, string>) =>
    [...map.entries()].map(([id, label]) => ({ id, label })).sort(byLabel);
  return { brandOptions: toOptions(brands), tagOptions: toOptions(tags) };
}

/**
 * The specialist's reviewed replies, narrowed by the URL filters
 * (`?brand=<id>&score=attention|acceptable|good&tag=<id>`). A brand or tag
 * id only counts when it appears in the specialist's own feedback, and any
 * unknown or malformed value is ignored rather than failing the page.
 */
export async function getFeedbackFeed(
  repo: FeedbackRepository,
  params: RawFeedbackParams,
): Promise<FeedbackFeed> {
  const all = await repo.listOwnReviewedReplies();
  const { brandOptions, tagOptions } = optionsFrom(all);

  const brand = single(params.brand);
  const score = single(params.score);
  const tag = single(params.tag);

  const filters: FeedbackFilters = {
    brandId: brandOptions.some((o) => o.id === brand) ? brand : null,
    scoreBand: isScoreBand(score) ? score : null,
    tagId: tagOptions.some((o) => o.id === tag) ? tag : null,
  };

  const items = all.filter(
    (item) =>
      (filters.brandId === null || item.brandId === filters.brandId) &&
      (filters.scoreBand === null ||
        scoreInBand(item.score, filters.scoreBand)) &&
      (filters.tagId === null || item.tags.some((t) => t.id === filters.tagId)),
  );

  return {
    items,
    total: all.length,
    filters,
    brandOptions,
    tagOptions,
  };
}
