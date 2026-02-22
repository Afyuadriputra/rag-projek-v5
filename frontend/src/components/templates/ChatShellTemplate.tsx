import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function ChatShellTemplate({
  dark,
  deletingDoc,
  mobileMenuOpen,
  onCloseMobileMenu,
  desktopSidebar,
  mobileSidebar,
  mainContent,
}: {
  dark: boolean;
  deletingDoc: boolean;
  mobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
  desktopSidebar: ReactNode;
  mobileSidebar: ReactNode;
  mainContent: ReactNode;
}) {
  return (
    <div className="relative flex flex-1 min-h-0 min-w-0 overflow-hidden">
      {deletingDoc && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-20 backdrop-blur-[1px]",
            dark ? "bg-zinc-900/35" : "bg-white/40"
          )}
        >
          <div
            className={cn(
              "absolute right-4 top-4 rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm",
              dark ? "bg-zinc-900/90 text-zinc-200" : "bg-white/80 text-zinc-600"
            )}
          >
            <span className="inline-flex items-center gap-2">
              <span className="size-3 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
              Menghapus dokumen...
            </span>
          </div>
        </div>
      )}

      <div className="hidden h-full md:flex">{desktopSidebar}</div>

      <div
        className={cn(
          "fixed inset-0 z-40 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          dark ? "bg-black/45" : "bg-black/20",
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onCloseMobileMenu}
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] backdrop-blur-2xl transition-transform duration-300 ease-out md:hidden shadow-2xl",
          dark ? "bg-zinc-900/95" : "bg-white/90",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {mobileSidebar}
      </div>

      {mainContent}
    </div>
  );
}
