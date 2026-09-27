/**
 * Shared kernel: used by the reviews, brand-trend and feedback features.
 * The score domain rule (spec: "Reviewing a reply requires a score, MAY
 * include tags and a note"). A score is an integer from 1 to 5, always
 * shown as number plus label — never colour alone (design.md A22).
 */
export const SCORE_VALUES = [1, 2, 3, 4, 5] as const;

export type Score = (typeof SCORE_VALUES)[number];

export const SCORE_LABELS: Record<Score, string> = {
  1: "Harmful",
  2: "Poor",
  3: "Acceptable",
  4: "Good",
  5: "Exemplary",
};

export function isValidScore(value: unknown): value is Score {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    (SCORE_VALUES as readonly number[]).includes(value)
  );
}

export function scoreLabel(score: Score): string {
  return SCORE_LABELS[score];
}

/** Averages (trend, per-specialist stats) are labelled by their nearest score. */
export function roundScore(value: number): Score {
  return Math.min(5, Math.max(1, Math.round(value))) as Score;
}

// Literal class names so Tailwind's scanner generates them; a template
// literal like `text-score-${n}` would silently produce no CSS (A22).
export const SCORE_TEXT_CLASSES: Record<Score, string> = {
  1: "text-score-1",
  2: "text-score-2",
  3: "text-score-3",
  4: "text-score-4",
  5: "text-score-5",
};
