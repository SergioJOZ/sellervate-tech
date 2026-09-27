import type {
  FeedbackItem,
  FeedbackRepository,
} from "../ports/feedback-repository";
import {
  scoreChange,
  scoreWindowOf,
  type ScoreChange,
} from "../domain/score-window";

export interface ScoreWindowStats {
  /** null when the window has no reviewed replies. */
  avgScore: number | null;
  n: number;
}

export interface FrequentIssue {
  tagId: string;
  label: string;
  count: number;
}

export interface BrandAverage {
  brandId: string;
  brandName: string;
  avgScore: number;
  n: number;
}

export interface FeedbackSummary {
  last4Weeks: ScoreWindowStats;
  previous4Weeks: ScoreWindowStats;
  /** null when either window has no reviewed replies to compare. */
  change: ScoreChange | null;
  /** Most frequent tag in the last 4 weeks; null when none was tagged. */
  mostFrequentIssue: FrequentIssue | null;
  /** Last 4 weeks, only brands with reviews, best average first. */
  byBrand: BrandAverage[];
}

export type GetFeedbackSummaryResult =
  { empty: true } | { empty: false; summary: FeedbackSummary };

function average(scores: number[]): number | null {
  if (scores.length === 0) return null;
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

function windowStats(items: FeedbackItem[]): ScoreWindowStats {
  return { avgScore: average(items.map((i) => i.score)), n: items.length };
}

/** Ties: higher count first, then label A–Z, so the pick is stable. */
function mostFrequentIssue(items: FeedbackItem[]): FrequentIssue | null {
  const counts = new Map<string, FrequentIssue>();
  for (const item of items) {
    for (const tag of item.tags) {
      const entry = counts.get(tag.id) ?? {
        tagId: tag.id,
        label: tag.label,
        count: 0,
      };
      entry.count += 1;
      counts.set(tag.id, entry);
    }
  }
  const [top] = [...counts.values()].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label),
  );
  return top ?? null;
}

function byBrand(items: FeedbackItem[]): BrandAverage[] {
  const groups = new Map<string, { brandName: string; scores: number[] }>();
  for (const item of items) {
    const group = groups.get(item.brandId) ?? {
      brandName: item.brandName,
      scores: [],
    };
    group.scores.push(item.score);
    groups.set(item.brandId, group);
  }
  return [...groups.entries()]
    .map(([brandId, { brandName, scores }]) => ({
      brandId,
      brandName,
      avgScore: average(scores)!,
      n: scores.length,
    }))
    .sort(
      (a, b) =>
        b.avgScore - a.avgScore || a.brandName.localeCompare(b.brandName),
    );
}

/**
 * The specialist's own performance over the last 4 weeks vs the 4 before,
 * windows by reply `sent_at` (A14). Always computed over ALL of their
 * reviewed replies — feed filters never change it. `now` is injected so the
 * windows are deterministic.
 */
export async function getFeedbackSummary(
  repo: FeedbackRepository,
  now: Date,
): Promise<GetFeedbackSummaryResult> {
  const items = await repo.listOwnReviewedReplies();

  const last4: FeedbackItem[] = [];
  const previous4: FeedbackItem[] = [];
  for (const item of items) {
    const window = scoreWindowOf(item.sentAt, now);
    if (window === "last4Weeks") last4.push(item);
    else if (window === "previous4Weeks") previous4.push(item);
  }

  if (last4.length === 0 && previous4.length === 0) {
    return { empty: true };
  }

  const last4Weeks = windowStats(last4);
  const previous4Weeks = windowStats(previous4);
  const change =
    last4Weeks.avgScore !== null && previous4Weeks.avgScore !== null
      ? scoreChange(last4Weeks.avgScore, previous4Weeks.avgScore)
      : null;

  return {
    empty: false,
    summary: {
      last4Weeks,
      previous4Weeks,
      change,
      mostFrequentIssue: mostFrequentIssue(last4),
      byBrand: byBrand(last4),
    },
  };
}
