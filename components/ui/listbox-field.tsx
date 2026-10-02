"use client";

import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import { useCallback, useId, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { useDismiss, usePresence } from "./use-popover";

export type ListboxOption = { value: string; label: string };

type ListboxFieldProps = {
  // Read by screen readers; there is no visible label.
  label: string;
  name: string;
  icon: LucideIcon;
  options: ListboxOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
};

const OPTION_HEIGHT = 40;

// Pill dropdown with a custom list: a highlight slides between options as you hover or arrow
// through them. The value is posted through a hidden input, like a native select.
export function ListboxField({ label, name, icon: Icon, options, value, defaultValue, onChange, className }: ListboxFieldProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [own, setOwn] = useState(defaultValue ?? options[0]?.value ?? "");
  const selected = value ?? own;
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === selected));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(selectedIndex);
  const { mounted, closing } = usePresence(open);

  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);
  useDismiss(rootRef, open, (reason) => close(reason === "escape"));

  function show() {
    setActive(selectedIndex);
    setOpen(true);
  }

  function choose(index: number) {
    const next = options[index].value;
    setOwn(next);
    onChange?.(next);
    close(true);
  }

  function onTriggerKey(event: KeyboardEvent) {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      show();
    }
  }

  function onListKey(event: KeyboardEvent) {
    const last = options.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: Math.min(last, active + 1),
      ArrowUp: Math.max(0, active - 1),
      Home: 0,
      End: last,
    };
    if (event.key in moves) {
      event.preventDefault();
      setActive(moves[event.key]);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(active);
    } else if (event.key === "Tab") {
      close(false);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative min-w-0", className)}>
      <input type="hidden" name={name} value={selected} />
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${label}: ${options[selectedIndex]?.label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        onClick={() => (open ? close(false) : show())}
        onKeyDown={onTriggerKey}
        className={cn(
          "group flex h-11 w-full min-w-0 items-center gap-2 rounded-full border bg-surface pr-3 pl-3 text-left text-sm text-foreground outline-none transition",
          open ? "border-brand ring-3 ring-brand/18" : "border-border-strong hover:border-foreground/60 focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/18",
        )}
      >
        <Icon aria-hidden className={cn("size-4 shrink-0 transition", open ? "text-brand" : "text-muted")} />
        <span key={selected} className="min-w-0 flex-1 truncate animate-value-in">
          {options[selectedIndex]?.label}
        </span>
        <ChevronDown aria-hidden className={cn("size-4 shrink-0 text-muted transition-transform duration-300", open && "rotate-180 text-brand")} />
      </button>

      {mounted && (
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          aria-activedescendant={`${id}-opt-${active}`}
          ref={(node) => {
            if (node && open) node.focus({ preventScroll: true });
          }}
          onKeyDown={onListKey}
          className={cn(
            "absolute top-full left-0 z-50 mt-2 w-full min-w-44 origin-top rounded-3xl border border-border bg-surface p-1.5 shadow-[0_18px_40px_-18px_rgb(20_32_43/0.45)] outline-none",
            closing ? "pointer-events-none animate-popover-out" : "animate-popover-in",
          )}
        >
          {/* One highlight shared by all options, so it glides from item to item. */}
          <span
            aria-hidden
            className="absolute inset-x-1.5 top-1.5 rounded-full bg-brand/8 transition-transform duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
            style={{ height: OPTION_HEIGHT, transform: `translateY(${active * OPTION_HEIGHT}px)` }}
          />
          {options.map((option, index) => {
            const isSelected = index === selectedIndex;
            return (
              <li
                key={option.value}
                id={`${id}-opt-${index}`}
                role="option"
                aria-selected={isSelected}
                onPointerMove={() => setActive(index)}
                onClick={() => choose(index)}
                style={{ height: OPTION_HEIGHT, animationDelay: `${index * 22}ms` }}
                className={cn(
                  "relative flex cursor-pointer items-center gap-2 rounded-full px-3 text-sm transition-colors animate-option-in",
                  isSelected ? "font-medium text-brand" : "text-foreground",
                )}
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {isSelected && <Check aria-hidden className="size-4 shrink-0 animate-pop" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
