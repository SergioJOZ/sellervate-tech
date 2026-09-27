/**
 * Pure comparison rules for the brand page. Every direction is rendered as
 * text (an arrow plus a word), never colour alone (design.md A22).
 */
export type Direction = "up" | "down" | "flat";

export type DirectionSymbol = "↑" | "↓" | "→";

function compare(current: number, previous: number): Direction {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "flat";
}

const SYMBOLS: Record<Direction, DirectionSymbol> = {
  up: "↑",
  down: "↓",
  flat: "→",
};

export interface TagDirectionResult {
  direction: Direction;
  symbol: DirectionSymbol;
  label: "getting worse" | "improving" | "no change";
}

/**
 * A failure tag counted in the last 4 weeks vs the 4 weeks before: more
 * occurrences means the brand is getting worse at it.
 */
export function tagDirection(
  last4Weeks: number,
  previous4Weeks: number,
): TagDirectionResult {
  const direction = compare(last4Weeks, previous4Weeks);
  const label =
    direction === "up"
      ? "getting worse"
      : direction === "down"
        ? "improving"
        : "no change";
  return { direction, symbol: SYMBOLS[direction], label };
}

export interface CountChangeResult {
  direction: Direction;
  symbol: DirectionSymbol;
  label: "more" | "fewer" | "no change";
}

/** A targeted tag's count before vs after a brand action. */
export function countChange(before: number, after: number): CountChangeResult {
  const direction = compare(after, before);
  const label =
    direction === "up" ? "more" : direction === "down" ? "fewer" : "no change";
  return { direction, symbol: SYMBOLS[direction], label };
}

export interface ScoreChangeResult {
  direction: Direction;
  symbol: DirectionSymbol;
  /** Difference rounded to one decimal, the precision the page shows. */
  delta: number;
}

/**
 * Average score now vs before. The delta is rounded to one decimal first, so
 * "→ 0.0" is never shown next to an arrow pointing up or down.
 */
export function scoreChange(
  current: number,
  previous: number,
): ScoreChangeResult {
  const delta = Math.round((current - previous) * 10) / 10;
  const direction = compare(delta, 0);
  return { direction, symbol: SYMBOLS[direction], delta };
}
