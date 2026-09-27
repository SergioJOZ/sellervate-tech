interface EmptyStateProps {
  title: string;
  message: string;
}

/**
 * Feature-local empty/forbidden state (spec: brand-trend — a brand with no
 * reviews yet, or one the caller does not lead, shows a designed state
 * instead of a chart with no data). Kept local per the PR 6 scope note:
 * shared presentational primitives are not owned by this feature.
 */
export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="bg-reading-surface rounded-box border-base-300 mx-auto mt-8 max-w-xl border p-8 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm opacity-70">{message}</p>
    </div>
  );
}
