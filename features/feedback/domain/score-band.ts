/**
 * The feed's score filter: three bands over the 1–5 scale. "All" is the
 * absence of a band, never a fourth value.
 */
export const SCORE_BANDS = ["attention", "acceptable", "good"] as const;

export type ScoreBand = (typeof SCORE_BANDS)[number];

export const SCORE_BAND_LABELS: Record<ScoreBand, string> = {
  attention: "Needs attention (1–2)",
  acceptable: "Acceptable (3)",
  good: "Good (4–5)",
};

export function isScoreBand(value: unknown): value is ScoreBand {
  return (
    typeof value === "string" &&
    (SCORE_BANDS as readonly string[]).includes(value)
  );
}

export function scoreInBand(score: number, band: ScoreBand): boolean {
  switch (band) {
    case "attention":
      return score <= 2;
    case "acceptable":
      return score === 3;
    case "good":
      return score >= 4;
  }
}
