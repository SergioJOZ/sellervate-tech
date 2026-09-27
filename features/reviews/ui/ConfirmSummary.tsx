import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { TagChip } from "@/components/ui/TagChip";
import type { Score } from "@/lib/score";
import type { Tag } from "../ports/review-repository";

interface ConfirmSummaryProps {
  score: Score;
  note: string;
  selectedTags: Tag[];
  pending: boolean;
  error: string | null;
  onBack: () => void;
  onConfirm: () => void;
}

/**
 * Spec: "Saving a review requires an explicit confirmation step" — an
 * inline summary of score/tags/note with Back/Confirm, stating the review
 * cannot be edited. Nothing is saved until Confirm is chosen.
 */
export function ConfirmSummary({
  score,
  note,
  selectedTags,
  pending,
  error,
  onBack,
  onConfirm,
}: ConfirmSummaryProps) {
  return (
    <div className="rounded-box flex flex-col gap-3 border border-base-300 bg-base-200 p-4">
      <p className="text-sm font-medium">Confirm this review</p>

      <div className="flex items-center gap-2">
        <ScoreBadge score={score} />
      </div>

      {selectedTags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <TagChip key={tag.id} label={tag.label} selected />
          ))}
        </div>
      ) : (
        <p className="text-sm opacity-60">No tags selected.</p>
      )}

      <div>
        <p className="text-xs font-medium uppercase opacity-60">Note</p>
        <p className="mt-1 text-sm whitespace-pre-wrap">
          {note.trim() || "(none)"}
        </p>
      </div>

      <p className="text-sm text-warning">
        This review cannot be edited after saving.
      </p>

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onBack}
          disabled={pending}
        >
          Back
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onConfirm}
          disabled={pending}
        >
          {pending ? "Saving…" : "Confirm"}
        </button>
      </div>
    </div>
  );
}
