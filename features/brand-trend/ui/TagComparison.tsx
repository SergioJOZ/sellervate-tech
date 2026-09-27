import type { TagCount } from "../ports/brand-trend-repository";
import { tagDirection } from "../domain/tag-trend";

interface TagComparisonProps {
  tagCounts: TagCount[];
}

/**
 * "What we keep getting wrong": one readable sentence per failure tag, last
 * 4 weeks vs the 4 before, already ordered by the repository (last-4-weeks
 * desc, then label). Direction is written out — never colour alone.
 */
export function TagComparison({ tagCounts }: TagComparisonProps) {
  if (tagCounts.length === 0) {
    return (
      <p className="text-sm opacity-70">
        No tagged failures in the last eight weeks.
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-base-300">
      {tagCounts.map((tag) => {
        const dir = tagDirection(tag.last4Weeks, tag.previous4Weeks);
        return (
          <li
            key={tag.tagId}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2"
          >
            <p>
              <span className="font-medium">{tag.label}</span>{" "}
              <span className="tabular-nums">
                {`— ${tag.last4Weeks} in the last 4 weeks (was ${tag.previous4Weeks})`}
              </span>
            </p>
            <p className="text-sm whitespace-nowrap">
              {dir.symbol} {dir.label}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
