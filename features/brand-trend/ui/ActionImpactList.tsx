import type { NumberedAction } from "../application/get-brand-trend-page";
import type { ImpactWindow } from "../ports/brand-trend-repository";
import { countChange } from "../domain/tag-trend";
import { EmptyState } from "@/components/ui/EmptyState";
import { actionMarker, formatAverage, formatDate, pluralize } from "./format";

interface ActionImpactListProps {
  /** Chronological, as numbered by the use case; shown newest first. */
  actions: NumberedAction[];
}

function averageText(window: ImpactWindow): string {
  return window.avgScore === null
    ? "no reviews"
    : `${formatAverage(window.avgScore)} (${pluralize(window.n, "review")})`;
}

/**
 * "What we changed": one card per brand action, numbered like its marker
 * on the trend chart, with the 4 weeks before vs the 4 weeks after it
 * (`brand_action_impact`). Direction is always written out, never colour.
 */
export function ActionImpactList({ actions }: ActionImpactListProps) {
  if (actions.length === 0) {
    return (
      <EmptyState
        title="No actions recorded yet"
        description="When the team changes something for this brand — coaching, a new macro, a policy update — record it here to see whether the scores moved afterwards."
      />
    );
  }

  const newestFirst = [...actions].reverse();

  return (
    <ol className="flex flex-col gap-4">
      {newestFirst.map((action) => {
        const impact = action.impact;
        const tagChange =
          impact &&
          impact.before.tagCount !== null &&
          impact.after.tagCount !== null
            ? {
                before: impact.before.tagCount,
                after: impact.after.tagCount,
                change: countChange(
                  impact.before.tagCount,
                  impact.after.tagCount,
                ),
              }
            : null;

        return (
          <li
            key={action.id}
            className="rounded-box flex flex-col gap-3 border border-base-300 bg-base-200 p-4"
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="text-accent text-xl leading-none"
              >
                {actionMarker(action.number)}
              </span>
              <span className="sr-only">Action {action.number}.</span>
              <div className="flex flex-col gap-1">
                <p className="text-sm opacity-70">
                  {formatDate(action.takenAt)} · {action.authorName}
                </p>
                <p>{action.note}</p>
                {action.tagLabel && (
                  <p className="text-sm">
                    <span className="opacity-70">Targets:</span>{" "}
                    {action.tagLabel}
                  </p>
                )}
              </div>
            </div>

            {impact && (
              <div className="flex flex-col gap-1 border-t border-base-300 pt-3 text-sm">
                <p className="font-medium">
                  Before → after (4 weeks each side)
                </p>
                {impact.weeksAfter < 4 && (
                  <p className="text-warning">
                    Still measuring ({pluralize(impact.weeksAfter, "week")} of
                    data after)
                  </p>
                )}
                {tagChange && (
                  <p className="tabular-nums">
                    {action.tagLabel}: {tagChange.before} → {tagChange.after}{" "}
                    {tagChange.change.symbol} {tagChange.change.label}
                  </p>
                )}
                <p className="tabular-nums">
                  Average score: {averageText(impact.before)} →{" "}
                  {averageText(impact.after)}
                </p>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
