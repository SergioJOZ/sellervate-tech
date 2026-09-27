"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { TagChip } from "@/components/ui/TagChip";
import { SCORE_VALUES, type Score } from "../domain/score";
import type { Tag } from "../ports/review-repository";
import { ConfirmSummary } from "./ConfirmSummary";

interface ReviewFormProps {
  replyId: string;
  offerableTags: Tag[];
  nextQueueReplyId: string | null;
  brandFilter: string | null;
  submitReviewAction: (
    replyId: string,
    score: number,
    note: string,
    tagIds: string[],
  ) => Promise<{ ok: boolean; reason?: string; message?: string }>;
}

/**
 * Spec: score required, tags/note optional, explicit confirm step, then
 * "Save & next" to the next unreviewed reply (design.md A21, sequence
 * diagram 2). Nothing is saved until Confirm is chosen (ConfirmSummary).
 */
export function ReviewForm({
  replyId,
  offerableTags,
  nextQueueReplyId,
  brandFilter,
  submitReviewAction,
}: ReviewFormProps) {
  const router = useRouter();
  const [score, setScore] = useState<Score | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId],
    );
  };

  const handleSubmit = () => {
    if (score === null) return;
    setError(null);
    setConfirming(true);
  };

  const handleConfirm = () => {
    if (score === null) return;
    setError(null);
    startTransition(async () => {
      const result = await submitReviewAction(
        replyId,
        score,
        note,
        selectedTagIds,
      );
      if (!result.ok) {
        setError(result.message ?? "The review could not be saved.");
        setConfirming(false);
        return;
      }
      const suffix = brandFilter ? `?brand=${brandFilter}` : "";
      router.push(
        nextQueueReplyId ? `/queue/${nextQueueReplyId}${suffix}` : "/queue",
      );
    });
  };

  const selectedTags = offerableTags.filter((tag) =>
    selectedTagIds.includes(tag.id),
  );

  if (confirming && score !== null) {
    return (
      <ConfirmSummary
        score={score}
        note={note}
        selectedTags={selectedTags}
        pending={pending}
        error={error}
        onBack={() => setConfirming(false)}
        onConfirm={handleConfirm}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-medium">Score</p>
        <div className="flex flex-wrap gap-2">
          {SCORE_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setScore(value)}
              className={score === value ? "" : "opacity-50"}
            >
              <ScoreBadge score={value} />
            </button>
          ))}
        </div>
        {score === null ? (
          <p className="mt-2 text-xs text-warning">
            Select a score from 1 to 5 to save.
          </p>
        ) : null}
      </div>

      {offerableTags.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium">Tags</p>
          <div className="flex flex-wrap gap-2">
            {offerableTags.map((tag) => (
              <TagChip
                key={tag.id}
                label={tag.label}
                selected={selectedTagIds.includes(tag.id)}
                onClick={() => toggleTag(tag.id)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="note">
          Note (optional)
        </label>
        <textarea
          id="note"
          className="textarea textarea-bordered w-full"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={score === null}
          onClick={handleSubmit}
        >
          Review
        </button>
      </div>
    </div>
  );
}
