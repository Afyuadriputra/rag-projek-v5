import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type PlannerDoc = { id: number; title: string };

export default function PlannerDocPickerSheet({
  open,
  docs,
  selectedIds,
  onClose,
  onConfirm,
  onClear,
}: {
  open: boolean;
  docs: PlannerDoc[];
  selectedIds: number[];
  onClose: () => void;
  onConfirm: (ids: number[]) => void;
  onClear: () => void;
}) {
  const [localSelected, setLocalSelected] = useState<number[]>(selectedIds);

  useEffect(() => {
    if (open) setLocalSelected(selectedIds);
  }, [open, selectedIds]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const selectedSet = useMemo(() => new Set(localSelected), [localSelected]);
  const canConfirm = localSelected.length > 0;

  if (!open) return null;

  return (
    <div
      data-testid="planner-doc-picker-sheet"
      className="fixed inset-0 z-[1200] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="planner-doc-picker-title"
    >
      <button
        type="button"
        aria-label="Tutup pemilih dokumen"
        onClick={onClose}
        className="absolute inset-0 bg-black/35 backdrop-blur-[1px]"
      />

      <div className="relative z-[1201] flex max-h-[82vh] w-[min(720px,94vw)] flex-col overflow-hidden rounded-t-3xl border border-[color:var(--surface-border-strong)] bg-[color:var(--surface-elevated-strong)] shadow-[var(--shadow-glass)] sm:rounded-3xl">
        <div className="sticky top-0 z-10 border-b border-[color:var(--surface-border)] bg-[color:var(--surface-elevated-strong)]/95 px-4 py-3 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 id="planner-doc-picker-title" className="text-sm font-bold text-[color:var(--text-primary)]">
                Pilih Dokumen Existing
              </h3>
              <p className="mt-1 text-xs text-[color:var(--text-secondary)]">
                Pilih minimal satu dokumen untuk digunakan sebagai sumber planner.
              </p>
            </div>
            <button
              type="button"
              data-testid="planner-doc-picker-close"
              onClick={onClose}
              className="rounded-xl px-2 py-1 text-xs font-semibold text-[color:var(--text-tertiary)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              Tutup
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-3 py-3">
          {docs.length === 0 ? (
            <div className="rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-muted)] px-3 py-4 text-xs text-[color:var(--text-secondary)]">
              Belum ada dokumen embedded yang siap dipakai.
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map((doc) => {
                const checked = selectedSet.has(doc.id);
                return (
                  <label
                    key={doc.id}
                    data-testid={`planner-doc-row-${doc.id}`}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border px-3 py-2.5 transition",
                      checked
                        ? "border-[color:var(--accent-primary)] bg-[color:var(--surface-muted)]"
                        : "border-[color:var(--surface-border)] bg-[color:var(--surface-elevated)] hover:bg-[color:var(--surface-muted)]"
                    )}
                  >
                    <input
                      data-testid={`planner-doc-checkbox-${doc.id}`}
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-[color:var(--surface-border-strong)] text-[color:var(--accent-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                      checked={checked}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setLocalSelected((prev) => {
                          if (isChecked) return Array.from(new Set([...prev, doc.id]));
                          return prev.filter((x) => x !== doc.id);
                        });
                      }}
                    />
                    <span className="text-xs font-medium text-[color:var(--text-secondary)]">{doc.title}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-2 border-t border-[color:var(--surface-border)] bg-[color:var(--surface-elevated-strong)]/95 px-3 py-3 backdrop-blur">
          <div className="text-xs text-[color:var(--text-secondary)]">{localSelected.length} dokumen dipilih</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="planner-doc-picker-clear"
              onClick={() => {
                setLocalSelected([]);
                onClear();
              }}
              className="min-h-11 rounded-xl border border-[color:var(--surface-border-strong)] bg-[color:var(--surface-elevated)] px-3 py-2 text-xs font-semibold text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              Kosongkan
            </button>
            <button
              type="button"
              data-testid="planner-doc-picker-confirm"
              disabled={!canConfirm}
              onClick={() => onConfirm(localSelected)}
              className="min-h-11 rounded-xl bg-[color:var(--accent-primary)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[color:var(--accent-primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50"
            >
              Gunakan Dokumen Terpilih
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
