"use client";

import { useEffect, useState, type RefObject } from "react";

// Closes a popover on a pointer press outside `ref` or on Escape.
export function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, onDismiss: (reason: "outside" | "escape") => void) {
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onDismiss("outside");
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss("escape");
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, open, onDismiss]);
}

// Keeps a popover mounted for `ms` after it closes, so it can play its exit animation.
export function usePresence(open: boolean, ms = 140) {
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  useEffect(() => {
    if (open) return;
    const timer = setTimeout(() => setMounted(false), ms);
    return () => clearTimeout(timer);
  }, [open, ms]);
  return { mounted: mounted || open, closing: mounted && !open };
}
