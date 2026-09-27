/**
 * Documents the tag-scope rule enforced by RLS (design.md A8, spec
 * "The review form offers global tags plus the reply's brand tags"):
 * a tag is offerable for a reply if it is global (`brand_id IS NULL`) or
 * belongs to that reply's brand. The database is the enforcement point —
 * this function only mirrors the rule for UI filtering/tests and never
 * replaces the RLS check on `review_tags` insert.
 */
export interface ScopedTag {
  id: string;
  brandId: string | null;
}

export function isTagInScope(tag: ScopedTag, replyBrandId: string): boolean {
  return tag.brandId === null || tag.brandId === replyBrandId;
}
