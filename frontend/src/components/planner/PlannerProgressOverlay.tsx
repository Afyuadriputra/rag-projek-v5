import GlassCard from "@/components/atoms/GlassCard";
import InlineProgress from "@/components/atoms/InlineProgress";

export default function PlannerProgressOverlay({
  message,
  mode = "start",
}: {
  message: string;
  mode?: "start" | "branching" | "execute";
}) {
  if (mode === "branching") {
    return (
      <GlassCard className="mx-auto w-[min(900px,92%)]">
        <div className="space-y-4" aria-live="polite">
          <div className="flex items-center justify-between">
            <div className="h-4 w-2/5 animate-pulse rounded bg-[color:var(--surface-muted)]" />
            <div className="h-4 w-10 animate-pulse rounded bg-[color:var(--surface-muted)]" />
          </div>
          <div className="space-y-2">
            <div className="h-11 w-full animate-pulse rounded-2xl bg-[color:var(--surface-muted)]" />
            <div className="h-11 w-full animate-pulse rounded-2xl bg-[color:var(--surface-muted)]" />
          </div>
          <p className="text-center text-xs font-medium text-[color:var(--text-secondary)]">
            {message || "Menyesuaikan percabangan AI berdasarkan jawaban..."}
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="mx-auto w-[min(900px,92%)]">
      <div className="space-y-3" aria-live="polite">
        <InlineProgress message={message} />
        <p className="text-xs text-[color:var(--text-secondary)]">
          {mode === "execute"
            ? "Sistem sedang menyusun hasil akhir dari semua jawaban planner dan dokumen terpilih."
            : "Sistem sedang mengekstrak profil dokumen untuk menyusun langkah planner."}
        </p>
      </div>
    </GlassCard>
  );
}
