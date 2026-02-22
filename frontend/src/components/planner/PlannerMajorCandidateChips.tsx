import PillChip from "@/components/atoms/PillChip";
import type { PlannerProfileHintsSummary } from "@/lib/api";

export default function PlannerMajorCandidateChips({
  majorSummary,
}: {
  majorSummary?: PlannerProfileHintsSummary | null;
}) {
  if (!majorSummary?.major_candidates?.length) return null;
  const confidence = (majorSummary.confidence_summary || "").toLowerCase();
  const confidenceLabel =
    confidence === "high" ? "tinggi" : confidence === "medium" ? "sedang" : confidence === "low" ? "rendah" : "";

  return (
    <div className="space-y-2 rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-muted)] p-3 dark:bg-zinc-900/40">
      <p className="text-xs font-semibold text-[color:var(--text-secondary)] dark:text-zinc-200">
        Kandidat jurusan terdeteksi{confidenceLabel ? ` (confidence ${confidenceLabel})` : ""}:
      </p>
      <div className="flex flex-wrap gap-2">
        {majorSummary.major_candidates.slice(0, 3).map((c, idx) => (
          <PillChip key={`${String(c.value)}-${idx}`} variant="info">
            {c.label}
          </PillChip>
        ))}
      </div>
    </div>
  );
}
