import { roundScore, scoreLabel } from "@/lib/score";

/** "3 reviews", "1 review". */
export function pluralize(count: number, singular: string, plural?: string) {
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
}

/** An average as number plus label, e.g. "3.7 Good" (never colour alone). */
export function formatAverage(value: number): string {
  return `${value.toFixed(1)} ${scoreLabel(roundScore(value))}`;
}

/** Signed delta with a real minus sign, e.g. "+1.5", "−0.4", "0.0". */
export function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta.toFixed(1)}`;
  if (delta < 0) return `−${Math.abs(delta).toFixed(1)}`;
  return "0.0";
}
