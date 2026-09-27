import type {
  ReplyDetail,
  ReviewRepository,
  Tag,
} from "../ports/review-repository";

export interface ReplyWithTags {
  reply: ReplyDetail;
  offerableTags: Tag[];
}

/**
 * Spec: "The review form offers global tags plus the reply's brand tags."
 * Reads the reply and the tag options scoped to its brand.
 */
export async function getReplyWithTags(
  repository: ReviewRepository,
  replyId: string,
): Promise<ReplyWithTags | null> {
  const reply = await repository.getReplyDetail(replyId);
  if (!reply) return null;

  const offerableTags = await repository.listOfferableTags(reply.brandId);
  return { reply, offerableTags };
}
