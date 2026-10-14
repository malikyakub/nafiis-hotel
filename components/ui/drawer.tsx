"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  // Pinned under the content, e.g. the row's main actions.
  footer?: React.ReactNode;
  side?: "right" | "left";
  className?: string;
};

// Side panel over the page, built on <dialog>: focus stays inside, Escape and the backdrop close it.
export function Drawer({ open, onClose, title, subtitle, children, footer, side = "right", className }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      className={cn(
        "fixed inset-y-0 m-0 h-dvh max-h-none w-full max-w-[440px] bg-transparent p-0 backdrop:bg-foreground/30",
        side === "right" ? "left-auto right-0" : "left-0 right-auto",
      )}
    >
      {open && (
        <div
          className={cn(
            "flex h-full flex-col border-border bg-surface shadow-card",
            side === "right" ? "animate-drawer-right border-l" : "animate-drawer-left border-r",
            className,
          )}
        >
          <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <h2 className="font-display text-[22px] leading-7 font-normal">{title}</h2>
              {subtitle && <div className="mt-1 text-sm text-muted">{subtitle}</div>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-1 flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <X aria-hidden className="size-4" />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <footer className="flex flex-wrap gap-2 border-t border-border px-5 py-4">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}
