export default function PlannerDocSummary({ docs }: { docs: Array<{ id: number; title: string }> }) {
  const text = docs.map((d) => d.title).join(", ") || "-";
  return <div className="text-xs text-[color:var(--text-secondary)] dark:text-zinc-400">Dokumen: {text}</div>;
}
