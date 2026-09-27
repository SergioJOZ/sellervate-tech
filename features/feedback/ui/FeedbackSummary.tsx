import type { FeedbackSummary as FeedbackSummaryData } from "../application/get-feedback-summary";
import { roundScore, scoreLabel, SCORE_TEXT_CLASSES } from "@/lib/score";
import { StatTile } from "./StatTile";
import { formatAverage, formatDelta, pluralize } from "./format";

interface FeedbackSummaryProps {
  summary: FeedbackSummaryData;
}

/**
 * "How am I doing?" before the feed: last-4-weeks average, how many
 * reviewed replies it rests on, the change against the 4 weeks before, the
 * most frequent issue and the average per brand. Windows by reply `sent_at`,
 * the same as the brand page.
 */
export function FeedbackSummary({ summary }: FeedbackSummaryProps) {
  const { last4Weeks, previous4Weeks, change, mostFrequentIssue, byBrand } =
    summary;

  return (
    <section aria-label="Performance summary" className="flex flex-col gap-3">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile title="Last 4 weeks" caption="Average score">
          {last4Weeks.avgScore === null ? (
            <p className="text-sm">No reviewed replies in the last 4 weeks</p>
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
                (was {previous4Weeks.avgScore.toFixed(1)})
              </span>
            </p>
          )}
        </StatTile>
      </div>

      <p className="text-sm">
        <span className="opacity-70">Most frequent issue: </span>
        {mostFrequentIssue === null ? (
          <span>no issues tagged in the last 4 weeks</span>
        ) : (
          <span className="font-medium">
            {mostFrequentIssue.label} ({mostFrequentIssue.count})
          </span>
        )}
      </p>

      {byBrand.length > 0 && (
        <p className="text-sm">
          <span className="opacity-70">By brand: </span>
          {byBrand.map((brand, index) => (
            <span key={brand.brandId}>
              {index > 0 && <span className="opacity-50"> · </span>}
              <span
                title={pluralize(brand.n, "reviewed reply", "reviewed replies")}
              >
                {brand.brandName}{" "}
                <span
                  className={`font-medium tabular-nums ${SCORE_TEXT_CLASSES[roundScore(brand.avgScore)]}`}
                >
                  {formatAverage(brand.avgScore)}
                </span>
              </span>
            </span>
          ))}
        </p>
      )}
    </section>
  );
}
