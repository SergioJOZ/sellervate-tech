import type { ReactNode } from "react";
import type { BrandScoreSummary } from "../application/get-brand-trend-page";
import { roundScore, scoreLabel, SCORE_TEXT_CLASSES } from "@/lib/score";
import { formatAverage, formatDelta } from "./format";

interface SummaryTilesProps {
  summary: BrandScoreSummary;
}

function Tile({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-box flex flex-col gap-1 border border-base-300 bg-base-200 p-4">
      <p className="text-sm opacity-70">{title}</p>
      {children}
    </div>
  );
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
      <Tile title="Last 4 weeks">
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
        <p className="text-xs opacity-60">Average score</p>
      </Tile>

      <Tile title="Reviewed replies">
        <p className="text-xl font-semibold tabular-nums">{last4Weeks.n}</p>
        <p className="text-xs opacity-60">Sent in the last 4 weeks</p>
      </Tile>

      <Tile title="vs previous 4 weeks">
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
        <p className="text-xs opacity-60">Change in average score</p>
      </Tile>
    </div>
  );
}
