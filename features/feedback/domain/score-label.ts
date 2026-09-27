/**
 * Same score-ramp label mapping as `features/brand-trend/domain/score-label`
 * (design.md A22). Duplicated intentionally: hexagonal features keep their
 * own pure domain and do not import each other's internals.
 */
export const SCORE_LABELS = {
  1: "Harmful",
  2: "Poor",
  3: "Acceptable",
  4: "Good",
  5: "Exemplary",
} as const;

export function scoreLabel(score: number): string {
  const rounded = Math.min(5, Math.max(1, Math.round(score))) as
    1 | 2 | 3 | 4 | 5;
  return SCORE_LABELS[rounded];
}

export function scoreColorClass(score: number): string {
  const rounded = Math.min(5, Math.max(1, Math.round(score)));
  return `text-score-${rounded}`;
}
