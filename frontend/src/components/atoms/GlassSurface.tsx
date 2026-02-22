import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export default function GlassSurface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-xl)] border border-[color:var(--surface-border)]",
        "bg-[color:var(--surface-elevated)] backdrop-blur-[var(--glass-blur-md)]",
        "shadow-[var(--shadow-glass)]",
        "before:pointer-events-none before:absolute before:inset-0",
        "before:bg-[radial-gradient(110%_88%_at_20%_0%,rgba(255,255,255,0.42)_0%,transparent_58%)]",
        className
      )}
      {...props}
    />
  );
}
