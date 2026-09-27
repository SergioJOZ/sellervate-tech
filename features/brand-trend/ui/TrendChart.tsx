import type { WeeklyScorePoint } from "../ports/brand-trend-repository";
import type { NumberedAction } from "../application/get-brand-trend-page";
import {
  roundScore,
  scoreLabel,
  SCORE_TEXT_CLASSES,
  SCORE_VALUES,
} from "@/lib/score";
import { formatAverage, pluralize } from "@/lib/format";
import { actionMarker, formatDate, formatWeek, truncate } from "./format";

interface TrendChartProps {
  weeklyScores: WeeklyScorePoint[];
  /** Chronological, numbered to match the "What we changed" cards. */
  actions: NumberedAction[];
}

const AXIS_WIDTH = 96; // room for "5 Exemplary"
const PAD_RIGHT = 32;
const INSET = 24; // keeps the first/last point off the axis
const MARKER_BAND = 52; // two rows of action badges above the plot
const PLOT_HEIGHT = 160;
const X_LABELS_HEIGHT = 44;
const WEEK_GAP = 76;
const MIN_PLOT_WIDTH = 320;
const LABEL_MAX_CHARS = 40;
const LABEL_CHAR_WIDTH = 6.5; // rough width of a 12px Outfit glyph
const MARKER_ROWS_Y = [20, 42];

/**
 * Hand-rolled server-rendered SVG (design.md A15): one point per ISO week
 * coloured by its score, the review count under each week, and a numbered
 * dashed marker per brand action. No client JS, no charting dependency.
 */
export function TrendChart({ weeklyScores, actions }: TrendChartProps) {
  if (weeklyScores.length === 0) return null;

  const plotWidth = Math.max(
    MIN_PLOT_WIDTH,
    INSET * 2 + (weeklyScores.length - 1) * WEEK_GAP,
  );
  const width = AXIS_WIDTH + plotWidth + PAD_RIGHT;
  const height = MARKER_BAND + PLOT_HEIGHT + X_LABELS_HEIGHT;
  const plotLeft = AXIS_WIDTH;
  const plotRight = AXIS_WIDTH + plotWidth;
  const plotTop = MARKER_BAND;
  const plotBottom = MARKER_BAND + PLOT_HEIGHT;

  const weekTimes = weeklyScores.map((w) => new Date(w.week).getTime());
  const minTime = weekTimes[0];
  const maxTime = weekTimes[weekTimes.length - 1];
  const timeSpan = maxTime - minTime || 1;
  const firstX = plotLeft + INSET;
  const lastX = weeklyScores.length === 1 ? firstX : plotRight - INSET;

  const xForTime = (t: number) =>
    firstX + ((t - minTime) / timeSpan) * (lastX - firstX);

  // 5 at the top, 1 at the bottom, with a little headroom for the points.
  const yForScore = (score: number) =>
    plotTop + 12 + ((5 - score) / 4) * (PLOT_HEIGHT - 24);

  const points = weeklyScores.map((w, i) => ({
    ...w,
    x: xForTime(weekTimes[i]),
    y: yForScore(w.avgScore),
    colour: SCORE_TEXT_CLASSES[roundScore(w.avgScore)],
  }));

  // Each segment is split at its midpoint so every half takes the colour of
  // the week it belongs to.
  const segments = points.slice(1).flatMap((to, i) => {
    const from = points[i];
    const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
    return [
      { key: `${from.week}-a`, from, to: mid, colour: from.colour },
      { key: `${from.week}-b`, from: mid, to, colour: to.colour },
    ];
  });

  // Greedy two-row layout so labels of nearby actions do not overlap.
  const rowEnds = MARKER_ROWS_Y.map(() => -Infinity);
  const markers = actions.map((action) => {
    const t = new Date(`${action.takenAt}T00:00:00Z`).getTime();
    const x = Math.min(plotRight, Math.max(plotLeft, xForTime(t)));
    const label = truncate(action.note, LABEL_MAX_CHARS);
    const labelWidth = label.length * LABEL_CHAR_WIDTH;
    const flip = x + 14 + labelWidth > width;
    const start = flip ? x - 14 - labelWidth : x - 10;
    const end = flip ? x + 10 : x + 14 + labelWidth;
    let row = rowEnds.findIndex((rowEnd) => rowEnd < start);
    if (row === -1) row = 0;
    rowEnds[row] = end + 8;
    return { action, x, label, flip, y: MARKER_ROWS_Y[row] };
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <svg
          role="img"
          aria-labelledby="trend-title trend-desc"
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
        >
          <title id="trend-title">Weekly average score trend</title>
          <desc id="trend-desc">
            {points
              .map(
                (p) =>
                  `Week of ${formatWeek(p.week)}: average score ${formatAverage(p.avgScore)} over ${pluralize(p.n, "review")}`,
              )
              .join(". ")}
            {actions.length > 0
              ? `. Actions: ${actions
                  .map(
                    (a) =>
                      `${actionMarker(a.number)} ${formatDate(a.takenAt)}: ${a.note}`,
                  )
                  .join("; ")}`
              : ""}
          </desc>

          {/* Y axis: one gridline per score, labelled number plus word. */}
          {SCORE_VALUES.map((score) => {
            const y = yForScore(score);
            return (
              <g key={score}>
                <line
                  x1={plotLeft}
                  x2={plotRight}
                  y1={y}
                  y2={y}
                  className="stroke-base-content"
                  strokeOpacity={0.12}
                  strokeWidth={1}
                />
                <text
                  x={plotLeft - 8}
                  y={y}
                  dominantBaseline="middle"
                  textAnchor="end"
                  className={`fill-current text-xs ${SCORE_TEXT_CLASSES[score]}`}
                >
                  {score} {scoreLabel(score)}
                </text>
              </g>
            );
          })}

          {/* Action markers, drawn behind the line. */}
          {markers.map(({ action, x, label, flip, y }) => (
            <g key={action.id}>
              <title>{`${actionMarker(action.number)} ${formatDate(action.takenAt)}: ${action.note}`}</title>
              <line
                x1={x}
                x2={x}
                y1={y + 10}
                y2={plotBottom}
                className="stroke-accent"
                strokeWidth={2}
                strokeDasharray="4 3"
              />
              <text
                x={x}
                y={y}
                dominantBaseline="middle"
                textAnchor="middle"
                className="fill-accent"
                fontSize={20}
              >
                {actionMarker(action.number)}
              </text>
              <text
                x={flip ? x - 14 : x + 14}
                y={y}
                dominantBaseline="middle"
                textAnchor={flip ? "end" : "start"}
                className="fill-current text-xs"
              >
                {label}
              </text>
            </g>
          ))}

          {segments.map((s) => (
            <line
              key={s.key}
              x1={s.from.x}
              y1={s.from.y}
              x2={s.to.x}
              y2={s.to.y}
              className={s.colour}
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          ))}

          {points.map((p) => (
            <g key={p.week}>
              <circle
                cx={p.x}
                cy={p.y}
                r={5}
                className={`${p.colour} stroke-base-100`}
                fill="currentColor"
                strokeWidth={2}
              />
              <text
                x={p.x}
                y={plotBottom + 18}
                textAnchor="middle"
                className="fill-current text-xs"
              >
                {formatWeek(p.week)}
              </text>
              <text
                x={p.x}
                y={plotBottom + 34}
                textAnchor="middle"
                className="fill-current text-xs tabular-nums opacity-60"
              >
                {pluralize(p.n, "review")}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs opacity-80">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="flex items-center">
            <span className="bg-score-2 inline-block h-0.5 w-3" />
            <span className="bg-score-4 inline-block h-0.5 w-3" />
          </span>
          Line: weekly average score, coloured by score (5 Exemplary … 1
          Harmful)
        </li>
        <li className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="bg-score-4 inline-block h-2.5 w-2.5 rounded-full"
          />
          Point: one week, with its number of reviews underneath
        </li>
        {actions.length > 0 && (
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="text-accent text-base">
              {actionMarker(1)}
            </span>
            Numbered dashed line: an action we took, explained under &ldquo;What
            we changed&rdquo;
          </li>
        )}
      </ul>

      <table className="sr-only">
        <caption>Weekly average score trend, numeric values</caption>
        <thead>
          <tr>
            <th>Week</th>
            <th>Average score</th>
            <th>Reviews</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.week}>
              <td>{formatWeek(p.week)}</td>
              <td>{formatAverage(p.avgScore)}</td>
              <td>{p.n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
