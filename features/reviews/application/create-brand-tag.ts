import { checkTagLabel } from "../domain/brand-tag";
import type {
  CreateBrandTagResult,
  ReviewRepository,
} from "../ports/review-repository";

/**
 * A team lead creates a tag for the brand of the reply being reviewed —
 * never a global tag. The brand comes from the reply, read through RLS, so
 * a brand id is never taken from the client. The label is validated and
 * the slug derived here; RLS (`tags_insert`) is the authoritative check.
 */
export async function createBrandTag(
  repository: ReviewRepository,
  replyId: string,
  rawLabel: string,
  rawDescription: string,
): Promise<CreateBrandTagResult> {
  const reply = await repository.getReplyDetail(replyId);
  if (!reply) {
    return {
      ok: false,
      reason: "forbidden",
      message: "You do not have permission to create tags for this reply.",
    };
  }

  const check = checkTagLabel(rawLabel);
  if (!check.ok) {
    return { ok: false, reason: "invalid", message: check.message };
  }

  const description = rawDescription.trim() || null;
  const result = await repository.createBrandTag(
    reply.brandId,
    check.slug,
    check.label,
    description,
  );

  if (result.ok) return result;

  switch (result.reason) {
    // 23505: the same slug for this brand, or a global tag's slug
    // (`tags_reject_global_slug_shadow`), so the wording covers both.
    case "duplicate":
      return {
        ok: false,
        reason: "duplicate",
        message: "A tag with that name already exists.",
      };
    case "forbidden":
      return {
        ok: false,
        reason: "forbidden",
        message: `You do not have permission to create ${reply.brandName} tags.`,
      };
    default:
      return {
        ok: false,
        reason: "invalid",
        message: "The tag could not be created.",
      };
  }
}
