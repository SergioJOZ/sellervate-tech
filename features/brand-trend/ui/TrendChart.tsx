import type {
  BrandActionEntry,
  WeeklyScorePoint,
} from "../ports/brand-trend-repository";
import { roundScore, scoreLabel, SCORE_TEXT_CLASSES } from "@/lib/score";

interface TrendChartProps {
  weeklyScores: WeeklyScorePoint[];
  actions: BrandActionEntry[];
}

const PADDING_X = 32;
const PADDING_TOP = 16;
const PLOT_HEIGHT = 140;
const WEEK_GAP = 72;
const LABELS_HEIGHT = 56;

function formatWeek(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Hand-rolled server-rendered SVG (design.md A15): one point per ISO week,
 * `n` printed under each point, vertical markers for `brand_actions`. No
 * client JS, no charting dependency.
 */
export function TrendChart({ weeklyScores, actions }: TrendChartProps) {
  if (weeklyScores.length === 0) return null;

  const width = PADDING_X * 2 + Math.max(1, weeklyScores.length - 1) * WEEK_GAP;
  const height = PADDING_TOP + PLOT_HEIGHT + LABELS_HEIGHT;

  const weekTimes = weeklyScores.map((w) => new Date(w.week).getTime());
  const minTime = weekTimes[0];
  const maxTime = weekTimes[weekTimes.length - 1];
  const timeSpan = maxTime - minTime || 1;

  const xForTime = (t: number) =>
    weeklyScores.length === 1
      ? PADDING_X
      : PADDING_X + ((t - minTime) / timeSpan) * (width - PADDING_X * 2);

  const yForScore = (score: number) =>
    PADDING_TOP + PLOT_HEIGHT - ((score - 1) / 4) * PLOT_HEIGHT;

  const points = weeklyScores.map((w) => ({
    ...w,
    x: xForTime(new Date(w.week).getTime()),
    y: yForScore(w.avgScore),
  }));

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="overflow-x-auto">
      <svg
        role="img"
        aria-labelledby="trend-title trend-desc"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="text-primary"
      >
        <title id="trend-title">Weekly average score trend</title>
        <desc id="trend-desc">
          {points
            .map(
              (p) =>
                `Week of ${formatWeek(p.week)}: average score ${p.avgScore.toFixed(1)} (${scoreLabel(roundScore(p.avgScore))}) over ${p.n} review${p.n === 1 ? "" : "s"}`,
            )
            .join(". ")}
          {actions.length > 0
            ? `. Actions: ${actions
                .map((a) => `${a.takenAt} — ${a.note}`)
                .join("; ")}`
            : ""}
        </desc>

        {/* Action markers, drawn behind the line. */}
        {actions.map((action) => {
          const t = new Date(action.takenAt).getTime();
          const x = xForTime(t);
          return (
            <g key={action.id}>
              <title>{`${action.takenAt}: ${action.note}${action.tagLabel ? ` (${action.tagLabel})` : ""}`}</title>
              <line
                x1={x}
                x2={x}
                y1={PADDING_TOP}
                y2={PADDING_TOP + PLOT_HEIGHT}
                className="stroke-accent"
                strokeWidth={2}
                strokeDasharray="4 3"
              />
            </g>
          );
        })}

        <polyline
          points={polylinePoints}
          fill="none"
          className="stroke-primary"
          strokeWidth={2}
        />

        {points.map((p) => (
          <g key={p.week}>
            <circle
              cx={p.x}
              cy={p.y}
              r={4}
              className={SCORE_TEXT_CLASSES[roundScore(p.avgScore)]}
              fill="currentColor"
            />
            <text
              x={p.x}
              y={PADDING_TOP + PLOT_HEIGHT + 16}
              textAnchor="middle"
              className="fill-current text-xs tabular-nums opacity-70"
            >
              n={p.n}
            </text>
            <text
              x={p.x}
              y={PADDING_TOP + PLOT_HEIGHT + 32}
              textAnchor="middle"
              className="fill-current text-xs opacity-60"
            >
              {formatWeek(p.week)}
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-2 flex items-center gap-4 text-xs opacity-70">
        <span className="flex items-center gap-1">
          <span className="bg-primary inline-block h-0.5 w-4" /> Average score
        </span>
        {actions.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="bg-accent inline-block h-3 w-0.5" /> Brand action
            (hover the marker for the note)
          </span>
        )}
      </div>

      <table className="sr-only">
        <caption>Weekly average score trend, numeric values</caption>
        <thead>
          <tr>
            <th>Week</th>
            <th>Average score</th>
            <th>Reviews (n)</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.week}>
              <td>{formatWeek(p.week)}</td>
              <td>
                {p.avgScore.toFixed(1)} ({scoreLabel(roundScore(p.avgScore))})
              </td>
              <td>{p.n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
