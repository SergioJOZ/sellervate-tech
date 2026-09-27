/**
 * Pure label/colour-token mapping for the 1-5 score ramp (design.md A22).
 * A score is always shown as number + label, never colour alone — this
 * module only maps to text, the colour class is a presentational detail
 * applied in the UI layer alongside the label.
 */
export const SCORE_LABELS = {
  1: "Harmful",
  2: "Poor",
  3: "Acceptable",
  4: "Good",
  5: "Exemplary",
} as const;

export type Score = keyof typeof SCORE_LABELS;

export function scoreLabel(score: number): string {
  const rounded = Math.min(5, Math.max(1, Math.round(score))) as Score;
  return SCORE_LABELS[rounded];
}

export function scoreColorClass(score: number, prefix: "text" | "bg"): string {
  const rounded = Math.min(5, Math.max(1, Math.round(score)));
  return `${prefix}-score-${rounded}`;
}
