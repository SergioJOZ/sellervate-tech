export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <div className="bg-reading-surface rounded-box max-w-xl border border-base-300 p-8 text-center">
        <h1 className="text-2xl font-semibold text-primary">Reply Review</h1>
        <p className="font-serif text-reply mt-4 leading-relaxed">
          Team leads review specialists&apos; customer replies, brand by
          brand.
        </p>
        <p className="mt-6 text-sm">
          Example score:{" "}
          <span
            className="tabular-nums font-medium"
            style={{ color: "var(--score-4)" }}
          >
            4
          </span>{" "}
          — Good
        </p>
      </div>
    </main>
  );
}
