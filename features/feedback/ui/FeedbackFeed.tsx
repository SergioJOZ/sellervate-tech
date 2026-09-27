import type { FeedbackItem } from "../ports/feedback-repository";
import { roundScore, scoreLabel, SCORE_TEXT_CLASSES } from "@/lib/score";

interface FeedbackFeedProps {
  items: FeedbackItem[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Specialist self-view: reviewed replies only, newest first (spec:
 * specialist-feedback). A feed, not an inbox — no unreviewed replies, no
 * per-item actions.
 */
export function FeedbackFeed({ items }: FeedbackFeedProps) {
  return (
    <ul className="flex flex-col gap-6">
      {items.map((item) => (
        <li
          key={item.replyId}
          className="bg-reading-surface rounded-box border-base-300 border p-6"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm font-semibold text-primary">
              {item.brandName}
            </span>
            <span className="text-xs opacity-60">
              {formatDate(item.sentAt)}
            </span>
          </div>

          {item.subject && (
            <h3 className="mt-2 text-base font-medium">{item.subject}</h3>
          )}

          <div className="mt-4 flex flex-col gap-3">
            <p className="text-sm opacity-80">
              <span className="font-medium">Customer: </span>
              {item.customerMessage}
            </p>
            <p className="font-serif text-reply">{item.body}</p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-base-300 pt-4">
            <span
              className={`font-semibold ${SCORE_TEXT_CLASSES[roundScore(item.score)]}`}
            >
              {item.score} · {scoreLabel(roundScore(item.score))}
            </span>
            {item.tags.length > 0 && (
              <span className="flex flex-wrap gap-1">
                {item.tags.map((tag) => (
                  <span key={tag.id} className="badge badge-sm badge-outline">
                    {tag.label}
                  </span>
                ))}
              </span>
            )}
          </div>

          {item.note && (
            <p className="mt-3 text-sm opacity-80">
              <span className="font-medium">
                {item.reviewerName ?? "Reviewer"}:{" "}
              </span>
              {item.note}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
