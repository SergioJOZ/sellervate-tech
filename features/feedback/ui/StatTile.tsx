import type { ReactNode } from "react";

interface StatTileProps {
  title: string;
  caption: string;
  children: ReactNode;
}

/** One summary figure: a title, the value, and what it is measured over. */
export function StatTile({ title, caption, children }: StatTileProps) {
  return (
    <div className="rounded-box flex flex-col gap-1 border border-base-300 bg-base-200 p-4">
      <p className="text-sm opacity-70">{title}</p>
      {children}
      <p className="text-xs opacity-60">{caption}</p>
    </div>
  );
}
