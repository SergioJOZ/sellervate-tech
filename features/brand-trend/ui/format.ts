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
