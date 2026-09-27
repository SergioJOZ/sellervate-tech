import type { ReplyDetail } from "../ports/review-repository";

interface ReplyViewProps {
  reply: ReplyDetail;
}

/**
 * Reading surface for the customer message and the specialist's reply
 * (design.md A22): `bg-reading-surface` + `font-serif text-reply`.
 */
export function ReplyView({ reply }: ReplyViewProps) {
  return (
    <div className="bg-reading-surface rounded-box flex flex-col gap-4 border border-base-300 p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm opacity-70">
        <span>{reply.brandName}</span>
        <span>{reply.specialistName}</span>
        <span>{new Date(reply.sentAt).toLocaleString()}</span>
      </div>

      {reply.subject ? (
        <h1 className="text-xl font-semibold">{reply.subject}</h1>
      ) : null}

      <section>
        <h2 className="text-xs font-medium uppercase opacity-60">
          Customer message
        </h2>
        <p className="font-serif text-reply mt-1 whitespace-pre-wrap">
          {reply.customerMessage}
        </p>
      </section>

      <section>
        <h2 className="text-xs font-medium uppercase opacity-60">Reply</h2>
        <p className="font-serif text-reply mt-1 whitespace-pre-wrap">
          {reply.body}
        </p>
      </section>
    </div>
  );
}
