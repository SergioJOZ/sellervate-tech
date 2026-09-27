/**
 * Pure rules for a tag a team lead creates from the review form. The
 * database stays the enforcement point for who may create it (RLS
 * `tags_insert`) and for uniqueness (UNIQUE NULLS NOT DISTINCT
 * (brand_id, slug), plus a trigger rejecting a global tag's slug); these
 * rules only shape the input.
 */
export const TAG_LABEL_MAX_LENGTH = 40;

export type TagLabelCheck =
  { ok: true; label: string; slug: string } | { ok: false; message: string };

/**
 * Lowercase ASCII with underscores, matching the seeded slugs
 * (e.g. "Wrong tone" -> "wrong_tone", "Lumé" -> "lume").
 */
export function slugifyTagLabel(label: string): string {
  return label
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function checkTagLabel(rawLabel: string): TagLabelCheck {
  const label = rawLabel.trim();
  if (label.length === 0) {
    return { ok: false, message: "Enter a label for the tag." };
  }
  if ([...label].length > TAG_LABEL_MAX_LENGTH) {
    return {
      ok: false,
      message: `Keep the label to ${TAG_LABEL_MAX_LENGTH} characters or fewer.`,
    };
  }
  const slug = slugifyTagLabel(label);
  if (slug.length === 0) {
    return {
      ok: false,
      message: "The label needs at least one letter or number.",
    };
  }
  return { ok: true, label, slug };
}
