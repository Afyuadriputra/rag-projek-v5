import GlassCard from "@/components/atoms/GlassCard";
import PlannerHeader from "@/components/planner/PlannerHeader";
import PlannerDocSummary from "@/components/planner/PlannerDocSummary";

export default function PlannerReviewCard({
  answers,
  docs,
  majorLabel,
  majorSource = "inferred",
  onEdit,
  onExecute,
  executing = false,
}: {
  answers: Record<string, string>;
  docs: Array<{ id: number; title: string }>;
  majorLabel?: string;
  majorSource?: "user_override" | "inferred" | string;
  onEdit: (stepKey: string) => void;
  onExecute: () => void;
  executing?: boolean;
}) {
  const labelMap: Record<string, string> = {
    intent: "Fokus Analisis",
    topic_interest: "Minat Bidang",
    topic_area: "Area Spesifik",
  };
  const humanize = (k: string) => {
    if (labelMap[k]) return labelMap[k];
    const txt = String(k || "").replace(/_/g, " ").trim();
    return txt ? txt.charAt(0).toUpperCase() + txt.slice(1) : "Langkah";
  };
  const entries = Object.entries(answers);
  return (
    <GlassCard className="mx-auto w-[min(900px,92%)]">
      <PlannerHeader title="Ringkasan Rencana" />
      {!!majorLabel && (
        <div className="mb-3 rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-muted)] px-3 py-2 text-xs text-[color:var(--text-secondary)]">
          Jurusan: <b>{majorLabel}</b> ({majorSource === "user_override" ? "dari user" : "dari inferensi"})
        </div>
      )}
      <div className="mb-4">
        <PlannerDocSummary docs={docs} />
      </div>
      <div className="space-y-2">
        {entries.map(([k, v]) => (
          <div
            key={k}
            className="flex items-start justify-between rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-elevated)] p-3"
          >
            <div>
              <div className="text-xs font-semibold text-[color:var(--text-primary)]">{humanize(k)}</div>
              <div className="text-sm text-[color:var(--text-secondary)]">{v}</div>
            </div>
            <button
              type="button"
              onClick={() => onEdit(k)}
              className="text-xs font-semibold text-[color:var(--text-tertiary)] hover:text-[color:var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              Edit
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onExecute}
          disabled={executing}
          className="min-h-11 rounded-2xl bg-[color:var(--accent-primary)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[color:var(--accent-primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-60"
        >
          {executing ? "Memproses..." : "Analisis Dokumen Sekarang"}
        </button>
      </div>
    </GlassCard>
  );
}
