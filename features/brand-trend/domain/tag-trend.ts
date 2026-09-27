/**
 * Pure direction rule for the recurring-failures comparison (last 4 weeks vs
 * previous 4 weeks). Direction is always rendered as text (↑/↓/→ plus a
 * word), never colour alone.
 */
export type TagDirection = "up" | "down" | "flat";

export interface TagDirectionResult {
  direction: TagDirection;
  symbol: "↑" | "↓" | "→";
  label: "up" | "down" | "flat";
}

export function tagDirection(
  last4Weeks: number,
  previous4Weeks: number,
): TagDirectionResult {
  if (last4Weeks > previous4Weeks) {
    return { direction: "up", symbol: "↑", label: "up" };
  }
  if (last4Weeks < previous4Weeks) {
    return { direction: "down", symbol: "↓", label: "down" };
  }
  return { direction: "flat", symbol: "→", label: "flat" };
}
