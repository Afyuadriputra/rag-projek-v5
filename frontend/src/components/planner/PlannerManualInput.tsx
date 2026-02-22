export default function PlannerManualInput({
  value,
  disabled,
  placeholder = "Atau tulis manual...",
  onChange,
}: {
  value: string;
  disabled?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <textarea
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full rounded-2xl border border-[color:var(--surface-border-strong)] bg-[color:var(--surface-elevated-strong)] p-3 text-sm text-[color:var(--text-primary)] backdrop-blur-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent dark:bg-zinc-900/40"
    />
  );
}
