import type { SpecialistStat } from "../ports/brand-trend-repository";
import { scoreColorClass, scoreLabel } from "../domain/score-label";

interface SpecialistTableProps {
  specialistStats: SpecialistStat[];
}

/**
 * Per-specialist breakdown, last 4 weeks, this brand only (design.md,
 * `brand_specialist_stats` — a shared specialist's row counts only this
 * brand's reviews).
 */
export function SpecialistTable({ specialistStats }: SpecialistTableProps) {
  if (specialistStats.length === 0) {
    return (
      <p className="text-sm opacity-70">
        No reviews for any specialist in the last 4 weeks.
      </p>
    );
  }

  return (
    <table className="table table-sm">
      <thead>
        <tr>
          <th>Specialist</th>
          <th>Average score</th>
          <th>Reviews (n)</th>
          <th>Top failure tag</th>
        </tr>
      </thead>
      <tbody>
        {specialistStats.map((s) => (
          <tr key={s.specialistId}>
            <td>{s.displayName}</td>
            <td>
              <span className={scoreColorClass(s.avgScore, "text")}>
                {s.avgScore.toFixed(1)} ({scoreLabel(s.avgScore)})
              </span>
            </td>
            <td className="tabular-nums">{s.n}</td>
            <td>{s.topTagLabel ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
