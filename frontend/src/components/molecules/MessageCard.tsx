import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export default function MessageCard({
  isUser,
  className,
  children,
}: PropsWithChildren<{ isUser: boolean; className?: string }>) {
  return (
    <div
      className={cn(
        "relative max-w-full min-w-0 overflow-hidden px-4 py-3 shadow-sm transition-[background-color,border-color] duration-[var(--motion-fast)] md:px-6 md:py-4",
        isUser
          ? "rounded-2xl rounded-tr-sm border border-black/10 bg-zinc-900 text-zinc-50 hover:bg-black"
          : "rounded-2xl rounded-tl-sm border border-[color:var(--surface-border)] bg-[color:var(--surface-elevated-strong)] text-[color:var(--text-primary)] hover:border-[color:var(--surface-border-strong)]",
        className
      )}
    >
      {children}
    </div>
  );
}
