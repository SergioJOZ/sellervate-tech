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
                <p className="font-medium">{reply.subject || "(no subject)"}</p>
                <p className="mt-1 text-xs opacity-70">
                  {new Date(reply.sentAt).toLocaleString()}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
