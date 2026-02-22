export default function PlannerRelevanceAlert({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--surface-border-strong)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm font-medium text-[color:var(--accent-danger)] dark:bg-zinc-900/40 dark:text-red-300">
      {message}
    </div>
  );
}
