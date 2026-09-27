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
      <header className="flex flex-col gap-1 border-b border-base-300 pb-4">
        <span className="badge badge-soft badge-primary self-start font-semibold uppercase tracking-wide">
          {reply.brandName}
        </span>
        <p className="text-sm">
          Written by{" "}
          <span className="font-semibold">{reply.specialistName}</span>
          <span className="opacity-60">
            {" "}
            · {new Date(reply.sentAt).toLocaleString()}
          </span>
        </p>
      </header>

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
        <h2 className="text-xs font-medium uppercase opacity-60">
          {reply.specialistName}&apos;s reply
        </h2>
        <p className="font-serif text-reply mt-1 whitespace-pre-wrap">
          {reply.body}
        </p>
      </section>
    </div>
  );
}
