import { cn } from "@/lib/utils";

export default function PlannerActionBar({
  leftLabel,
  rightLabel,
  leftDisabled,
  rightDisabled,
  onLeft,
  onRight,
}: {
  leftLabel: string;
  rightLabel: string;
  leftDisabled?: boolean;
  rightDisabled?: boolean;
  onLeft: () => void;
  onRight: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onLeft}
        disabled={leftDisabled}
        className="min-h-11 rounded-2xl border border-[color:var(--surface-border-strong)] bg-[color:var(--surface-elevated)] px-3.5 py-2 text-xs font-semibold text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-elevated-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50"
      >
        {leftLabel}
      </button>
      <button
        type="button"
        onClick={onRight}
        disabled={rightDisabled}
        className={cn(
          "min-h-11 rounded-2xl px-4 py-2 text-xs font-semibold text-white transition",
          "bg-[color:var(--accent-primary)] hover:bg-[color:var(--accent-primary-strong)] disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        )}
      >
        {rightLabel}
      </button>
    </div>
  );
}
