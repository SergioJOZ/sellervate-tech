import type {
  BrandTrendRepository,
  RecordActionResult,
} from "../ports/brand-trend-repository";

export interface RecordBrandActionInput {
  brandId: string;
  takenAt: string;
  note: string;
  tagId: string | null;
}

/**
 * Validates the minimal action form (date + note required, tag optional)
 * before delegating the insert to the repository. RLS still enforces "team
 * lead who is a member of that brand" server-side regardless of what this
 * validation allows (spec: brand-trend, recording an action).
 */
export async function recordBrandAction(
  repo: BrandTrendRepository,
  input: RecordBrandActionInput,
): Promise<RecordActionResult> {
  const note = input.note.trim();
  if (note.length === 0 || !input.takenAt) {
    return { ok: false, reason: "invalid" };
  }

  return repo.recordAction({
    brandId: input.brandId,
    takenAt: input.takenAt,
    note,
    tagId: input.tagId,
  });
}
