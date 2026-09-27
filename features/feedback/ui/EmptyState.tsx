/**
 * Feature-local empty state (spec: specialist-feedback — "Specialist with
 * no reviewed replies yet"). Kept local: presentational primitives shared
 * across features are out of scope for this PR.
 */
export function EmptyState() {
  return (
    <div className="bg-reading-surface rounded-box border-base-300 mx-auto mt-8 max-w-xl border p-8 text-center">
      <h2 className="text-lg font-semibold">No feedback yet</h2>
      <p className="mt-2 text-sm opacity-70">
        Once a team lead reviews one of your replies, it shows up here.
      </p>
    </div>
  );
}
