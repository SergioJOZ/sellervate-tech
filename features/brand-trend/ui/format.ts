import { roundScore, scoreLabel } from "@/lib/score";

/** "3 reviews", "1 review". */
export function pluralize(count: number, singular: string, plural?: string) {
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
}

/** Week start (ISO timestamp, UTC) as "Aug 3". */
export function formatWeek(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** A `date` column ("2026-08-26") as "Aug 26, 2026". */
export function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
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

const CIRCLED_NUMBERS = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";

/** Marker shared by an action's chart line and its card: ①, ②… */
export function actionMarker(number: number): string {
  return number >= 1 && number <= CIRCLED_NUMBERS.length
    ? CIRCLED_NUMBERS[number - 1]
    : `(${number})`;
}

export function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength
    ? text
    : `${text.slice(0, maxLength - 1).trimEnd()}…`;
}
