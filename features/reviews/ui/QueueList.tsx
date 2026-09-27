"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { QueueReply } from "../ports/review-repository";

interface QueueListProps {
  replies: QueueReply[];
  brands: { id: string; name: string; slug: string }[];
}

/**
 * The queue side of the split pane (design.md A21). Selection lives in
 * the URL (`/queue/[replyId]`). The brand filter is read client-side via
 * `useSearchParams` (`?brand=<id or slug>`) and restricted to the lead's
 * own brands — an unknown/foreign value in the query param is ignored.
 */
function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function QueueList({ replies, brands }: QueueListProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeReplyId = pathname.startsWith("/queue/")
    ? pathname.split("/")[2]
    : null;

  const rawFilter = searchParams.get("brand");
  const matchedBrand = rawFilter
    ? (brands.find((b) => b.id === rawFilter || b.slug === rawFilter) ?? null)
    : null;
  const selectedBrandId = matchedBrand?.id ?? null;

  const visibleReplies = selectedBrandId
    ? replies.filter((r) => r.brandId === selectedBrandId)
    : replies;

  const brandNameById = new Map(brands.map((b) => [b.id, b.name]));

  const brandFilterHref = (brandId: string | null) =>
    brandId ? `/queue?brand=${brandId}` : "/queue";

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <div className="flex flex-wrap gap-2">
        <Link
          href={brandFilterHref(null)}
          className={`badge ${selectedBrandId === null ? "badge-primary" : "badge-outline"}`}
        >
          All brands
        </Link>
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={brandFilterHref(brand.id)}
            className={`badge ${selectedBrandId === brand.id ? "badge-primary" : "badge-outline"}`}
          >
            {brand.name}
          </Link>
        ))}
      </div>

      {visibleReplies.length === 0 ? (
        <p className="mt-2 text-sm opacity-70">
          Queue clear — nothing unreviewed in your brands.
        </p>
      ) : null}

      <ul className="flex flex-col gap-2">
        {visibleReplies.map((reply) => {
          const href = selectedBrandId
            ? `/queue/${reply.id}?brand=${selectedBrandId}`
            : `/queue/${reply.id}`;
          const isActive = reply.id === activeReplyId;
          return (
            <li key={reply.id}>
              <Link
                href={href}
                className={`block rounded-box border p-3 text-sm transition-colors ${
                  isActive
                    ? "border-primary bg-base-300"
                    : "border-base-300 bg-base-200 hover:bg-base-300"
                }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className="badge badge-sm badge-soft badge-primary font-semibold uppercase tracking-wide">
                    {brandNameById.get(reply.brandId) ?? "Unknown brand"}
                  </span>
                  <span className="font-medium">{reply.specialistName}</span>
                  {/* Relative time depends on the clock, so server and client can differ by a minute. */}
                  <time
                    dateTime={reply.sentAt}
                    className="ml-auto opacity-60"
                    suppressHydrationWarning
                  >
                    {timeAgo(reply.sentAt)}
                  </time>
                </div>
                <p className="mt-2 font-medium">
                  {reply.subject || "(no subject)"}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
