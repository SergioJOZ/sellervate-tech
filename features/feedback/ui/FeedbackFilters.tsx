import Link from "next/link";
import type {
  FeedbackFilters as FeedbackFiltersData,
  FilterOption,
} from "../application/get-feedback-feed";
import { SCORE_BANDS, SCORE_BAND_LABELS } from "../domain/score-band";

interface FeedbackFiltersProps {
  filters: FeedbackFiltersData;
  brandOptions: FilterOption[];
  tagOptions: FilterOption[];
  clearHref: string;
}

/**
 * A plain GET form: the filters live in the URL and are read server-side,
 * so there is no client state. An empty option means "All" and is ignored
 * by the feed use case like any other unknown value.
 */
export function FeedbackFilters({
  filters,
  brandOptions,
  tagOptions,
  clearHref,
}: FeedbackFiltersProps) {
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-3"
      aria-label="Filter feedback"
    >
      <label className="flex flex-col gap-1 text-xs">
        <span className="opacity-70">Brand</span>
        <select
          name="brand"
          defaultValue={filters.brandId ?? ""}
          className="select select-sm"
        >
          <option value="">All brands</option>
          {brandOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs">
        <span className="opacity-70">Score</span>
        <select
          name="score"
          defaultValue={filters.scoreBand ?? ""}
          className="select select-sm"
        >
          <option value="">All scores</option>
          {SCORE_BANDS.map((band) => (
            <option key={band} value={band}>
              {SCORE_BAND_LABELS[band]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs">
        <span className="opacity-70">Issue</span>
        <select
          name="tag"
          defaultValue={filters.tagId ?? ""}
          className="select select-sm"
        >
          <option value="">All issues</option>
          {tagOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <button type="submit" className="btn btn-primary btn-sm">
        Apply
      </button>
      <Link href={clearHref} className="btn btn-ghost btn-sm">
        Clear
      </Link>
    </form>
  );
}
