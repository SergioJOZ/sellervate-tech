import type { TagCount } from "../ports/brand-trend-repository";
import { tagDirection } from "../domain/tag-trend";

interface TagComparisonProps {
  tagCounts: TagCount[];
}

/**
 * Recurring failures: last-4-weeks count next to previous-4-weeks count,
 * already ordered by the repository (last-4-weeks desc, then label).
 * Direction is shown as an arrow plus a word — never colour alone.
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
    <table className="table table-sm">
      <thead>
        <tr>
          <th>Tag</th>
          <th>Last 4 weeks</th>
          <th>Previous 4 weeks</th>
          <th>Direction</th>
        </tr>
      </thead>
      <tbody>
        {tagCounts.map((tag) => {
          const dir = tagDirection(tag.last4Weeks, tag.previous4Weeks);
          return (
            <tr key={tag.tagId}>
              <td>{tag.label}</td>
              <td className="tabular-nums">{tag.last4Weeks}</td>
              <td className="tabular-nums opacity-70">{tag.previous4Weeks}</td>
              <td>
                <span aria-hidden="true">{dir.symbol}</span> {dir.label}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
