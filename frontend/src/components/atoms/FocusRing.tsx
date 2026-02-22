import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export default function FocusRing({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-200",
        "ring-2 ring-[color:var(--accent-primary)] ring-offset-2 ring-offset-transparent",
        className
      )}
      {...props}
    />
  );
}
