import { scoreLabel, type Score } from "@/features/reviews/domain/score";

interface ScoreBadgeProps {
  score: Score;
  className?: string;
}

// Static class names per score so Tailwind's JIT scanner can see them —
// a template-literal `bg-score-${score}` would not be detected (A22).
const SCORE_BG_CLASSES: Record<Score, string> = {
  1: "bg-score-1",
  2: "bg-score-2",
  3: "bg-score-3",
  4: "bg-score-4",
  5: "bg-score-5",
};

/**
 * A score always shows as number plus label, never colour alone
 * (design.md A22). Uses the `text-score-N` / `bg-score-N` theme tokens.
 */
export function ScoreBadge({ score, className = "" }: ScoreBadgeProps) {
  return (
    <span
      className={`badge gap-1 border-none text-base-100 ${SCORE_BG_CLASSES[score]} ${className}`}
    >
      <span className="font-semibold tabular-nums">{score}</span>
      <span>{scoreLabel(score)}</span>
    </span>
  );
}
