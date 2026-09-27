/**
 * Rolling windows on the reply's `sent_at`, the same as the brand page
 * (design.md A14; `brand_score_windows`): the last 4 weeks is
 * `sent_at >= now - 4 weeks`, the previous 4 weeks is
 * `now - 8 weeks <= sent_at < now - 4 weeks`.
 */
export type ScoreWindowName = "last4Weeks" | "previous4Weeks";

const FOUR_WEEKS_MS = 28 * 24 * 60 * 60 * 1000;

export function scoreWindowOf(
  sentAt: string,
  now: Date,
): ScoreWindowName | null {
  const sent = new Date(sentAt).getTime();
  if (sent >= now.getTime() - FOUR_WEEKS_MS) return "last4Weeks";
  if (sent >= now.getTime() - 2 * FOUR_WEEKS_MS) return "previous4Weeks";
  return null;
}

export type Direction = "up" | "down" | "flat";

export interface ScoreChange {
  direction: Direction;
  symbol: "↑" | "↓" | "→";
  /** Difference rounded to one decimal, the precision the page shows. */
  delta: number;
}

const SYMBOLS: Record<Direction, ScoreChange["symbol"]> = {
  up: "↑",
  down: "↓",
  flat: "→",
};

/**
 * Average now vs before. The delta is rounded to one decimal first, so
 * "→ 0.0" is never shown next to an arrow pointing up or down. Same rule as
 * the brand page's `scoreChange`.
 */
export function scoreChange(current: number, previous: number): ScoreChange {
  const delta = Math.round((current - previous) * 10) / 10;
  const direction: Direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return { direction, symbol: SYMBOLS[direction], delta };
}
