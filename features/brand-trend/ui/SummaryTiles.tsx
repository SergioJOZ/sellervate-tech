import type { BrandScoreSummary } from "../application/get-brand-trend-page";
import { roundScore, scoreLabel, SCORE_TEXT_CLASSES } from "@/lib/score";
import { formatAverage, formatDelta } from "@/lib/format";
import { StatTile } from "@/components/ui/StatTile";

interface SummaryTilesProps {
  summary: BrandScoreSummary;
}

/**
 * The answer to "how is this brand doing?" before any chart: last-4-weeks
 * average, how many reviewed replies it rests on, and the change against
 * the 4 weeks before (windows by reply `sent_at`, `brand_score_windows`).
 */
export function SummaryTiles({ summary }: SummaryTilesProps) {
  const { last4Weeks, previous4Weeks, change } = summary;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatTile title="Last 4 weeks" caption="Average score">
        {last4Weeks.avgScore === null ? (
          <p className="text-sm">No reviewed replies yet</p>
        ) : (
          <p
            className={`text-xl font-semibold tabular-nums ${SCORE_TEXT_CLASSES[roundScore(last4Weeks.avgScore)]}`}
          >
            {last4Weeks.avgScore.toFixed(1)}{" "}
            <span className="text-lg font-medium">
              {scoreLabel(roundScore(last4Weeks.avgScore))}
            </span>
          </p>
        )}
      </StatTile>

      <StatTile title="Reviewed replies" caption="Sent in the last 4 weeks">
        <p className="text-xl font-semibold tabular-nums">{last4Weeks.n}</p>
      </StatTile>

      <StatTile title="vs previous 4 weeks" caption="Change in average score">
        {change === null || previous4Weeks.avgScore === null ? (
          <p className="text-sm">
            {previous4Weeks.avgScore === null
              ? "No reviewed replies in the previous 4 weeks"
              : "Nothing to compare yet"}
          </p>
        ) : (
          <p className="text-xl font-semibold tabular-nums">
            {change.symbol} {formatDelta(change.delta)}{" "}
            <span className="text-sm font-normal opacity-70">
              (was {formatAverage(previous4Weeks.avgScore)})
            </span>
          </p>
        )}
      </StatTile>
    </div>
  );
}
