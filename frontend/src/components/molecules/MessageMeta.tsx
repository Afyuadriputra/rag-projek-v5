import { cn } from "@/lib/utils";

export default function MessageMeta({
  role,
  time,
}: {
  role: "assistant" | "user";
  time?: string;
}) {
  const isUser = role === "user";
  return (
    <div
      className={cn(
        "mb-1.5 flex items-center gap-2 opacity-80 select-none",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--text-tertiary)] md:text-[11px]">
        {isUser ? "Mahasiswa" : "Academic AI"}
      </span>
      <span className="text-[10px] text-[color:var(--text-tertiary)] md:text-[11px]">{time}</span>
    </div>
  );
}
