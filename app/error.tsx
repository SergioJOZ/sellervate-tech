"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="bg-reading-surface rounded-box max-w-xl border border-base-300 p-8">
        <h1 className="text-xl font-semibold text-error">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm opacity-70">
          {error.message || "An unexpected error occurred."}
        </p>
        <button type="button" className="btn btn-primary mt-4" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
