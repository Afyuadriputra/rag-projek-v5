import { cn } from "@/lib/utils";
import type { PlannerProfileHintsSummary } from "@/lib/api";
import GlassCard from "@/components/atoms/GlassCard";
import PlannerHeader from "@/components/planner/PlannerHeader";
import PlannerRelevanceAlert from "@/components/planner/PlannerRelevanceAlert";
import PlannerMajorCandidateChips from "@/components/planner/PlannerMajorCandidateChips";

export default function PlannerOnboardingCard({
  hasEmbeddedDocs,
  onUploadNew,
  onOpenDocPicker,
  relevanceError,
  majorSummary,
  selectedDocTitles = [],
  selectedDocCount = 0,
  onClearDocSelection,
  disabled = false,
}: {
  hasEmbeddedDocs: boolean;
  onUploadNew: () => void;
  onOpenDocPicker: () => void;
  relevanceError?: string | null;
  majorSummary?: PlannerProfileHintsSummary | null;
  selectedDocTitles?: string[];
  selectedDocCount?: number;
  onClearDocSelection: () => void;
  disabled?: boolean;
}) {
  const preview = selectedDocTitles.slice(0, 3);
  return (
    <GlassCard className="mx-auto w-[min(900px,92%)]">
      <PlannerHeader
        title="Setup Dokumen Planner"
        subtitle="Gunakan dokumen existing atau unggah baru untuk memulai analisis adaptif."
      />
      <p className="mb-4 text-xs text-[color:var(--text-tertiary)]">
        Untuk hasil akurat, gunakan KHS, KRS, Jadwal, Transkrip, atau Kurikulum yang valid.
      </p>

      {relevanceError && <PlannerRelevanceAlert message={relevanceError} />}

      <div className="mt-4">
        <PlannerMajorCandidateChips majorSummary={majorSummary} />
      </div>

      <div className="mt-4 rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-muted)] p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--text-tertiary)]">
          Sumber aktif planner
        </div>
        <div className="mt-1 text-xs text-[color:var(--text-secondary)]">
          {selectedDocCount > 0
            ? `${selectedDocCount} dokumen dipilih`
            : hasEmbeddedDocs
              ? "Belum ada dokumen yang dipilih"
              : "Belum ada dokumen embedded"}
        </div>
        {preview.length > 0 ? (
          <div className="mt-2 text-xs text-[color:var(--text-secondary)]">
            {preview.join(", ")}
            {selectedDocCount > preview.length ? ` +${selectedDocCount - preview.length} lainnya` : ""}
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2">
        {hasEmbeddedDocs ? (
          <button
            type="button"
            data-testid="planner-open-doc-picker"
            onClick={onOpenDocPicker}
            disabled={disabled}
            className={cn(
              "flex min-h-12 items-center justify-between rounded-2xl border px-4 py-2 text-xs font-semibold transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              "border-[color:var(--accent-primary)] bg-[color:var(--surface-muted)] text-[color:var(--accent-primary)] hover:bg-[color:var(--surface-elevated-strong)]",
              disabled && "cursor-not-allowed opacity-60"
            )}
          >
            <span>Pilih Dokumen Existing</span>
            <span className="rounded-full border border-[color:var(--accent-primary)] bg-[color:var(--surface-elevated)] px-2 py-0.5 text-[10px] font-bold text-[color:var(--accent-primary)]">
              Terdeteksi
            </span>
          </button>
        ) : null}
        {selectedDocCount > 0 ? (
          <button
            type="button"
            data-testid="planner-clear-doc-selection"
            onClick={onClearDocSelection}
            disabled={disabled}
            className={cn(
              "min-h-11 rounded-2xl border px-4 py-2 text-xs font-semibold transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              "border-[color:var(--surface-border-strong)] bg-[color:var(--surface-elevated)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated-strong)]",
              disabled && "cursor-not-allowed opacity-60"
            )}
          >
            Kosongkan Pilihan Dokumen
          </button>
        ) : null}
        <button
          type="button"
          data-testid="planner-upload-new-docs"
          onClick={onUploadNew}
          disabled={disabled}
          className={cn(
            "min-h-12 rounded-2xl border border-dashed px-4 py-2 text-xs font-semibold transition",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
            "border-[color:var(--surface-border-strong)] bg-[color:var(--surface-elevated)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated-strong)]",
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          Unggah Dokumen Baru
        </button>
      </div>
    </GlassCard>
  );
}
