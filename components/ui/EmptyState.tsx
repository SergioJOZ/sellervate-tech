interface EmptyStateProps {
  title: string;
  description?: string;
}

/**
 * Purpose-written empty state (design.md A22 "Designed states"). Every
 * feature composes its own copy through `title`/`description` rather than
 * a generic "no data" message.
 */
export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <p className="text-lg font-medium">{title}</p>
      {description ? <p className="text-sm opacity-70">{description}</p> : null}
    </div>
  );
}
