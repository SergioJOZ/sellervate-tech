/**
 * Pure comparison rules for the brand page. Every direction is rendered as
 * text (an arrow plus a word), never colour alone (design.md A22). The
 * average-score change is the shared `scoreChange` in `lib/score.ts`.
 */
import {
  compareValues,
  DIRECTION_SYMBOLS,
  type Direction,
  type DirectionSymbol,
} from "@/lib/score";

export interface TagDirectionResult {
  direction: Direction;
  symbol: DirectionSymbol;
  label: "getting worse" | "improving" | "no change";
}

/**
 * A failure tag counted in the last 4 weeks vs the 4 weeks before: more
 * occurrences means the brand is getting worse at it. The arrow follows
 * quality, like the score tiles (↑ = better), not the raw count: fewer
 * failures read as "↑ improving".
 */
export function tagDirection(
  last4Weeks: number,
  previous4Weeks: number,
): TagDirectionResult {
  const direction = compareValues(last4Weeks, previous4Weeks);
  const label =
    direction === "up"
      ? "getting worse"
      : direction === "down"
        ? "improving"
        : "no change";
  const symbol: DirectionSymbol =
    direction === "up" ? "↓" : direction === "down" ? "↑" : "→";
  return { direction, symbol, label };
}

export interface CountChangeResult {
  direction: Direction;
  symbol: DirectionSymbol;
  label: "more" | "fewer" | "no change";
}

/** A targeted tag's count before vs after a brand action. */
export function countChange(before: number, after: number): CountChangeResult {
  const direction = compareValues(after, before);
  const label =
    direction === "up" ? "more" : direction === "down" ? "fewer" : "no change";
  return { direction, symbol: DIRECTION_SYMBOLS[direction], label };
}
