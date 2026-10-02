"use client";

import { Clock } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

type MenuTabsProps = {
  sections: { id: string; label: string; hours: string; items: { name: string; text: string; price: string }[] }[];
};

// Tabbed menu. One pill slides under the active tab; the dishes fade in one by one on switch.
export function MenuTabs({ sections }: MenuTabsProps) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const measure = () => {
      const tab = tabs.current[active];
      if (tab) setPill({ left: tab.offsetLeft, width: tab.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active]);

  function onKey(event: KeyboardEvent) {
    const last = sections.length - 1;
    const moves: Record<string, number> = {
      ArrowRight: active === last ? 0 : active + 1,
      ArrowLeft: active === 0 ? last : active - 1,
      Home: 0,
      End: last,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    setActive(moves[event.key]);
    tabs.current[moves[event.key]]?.focus();
  }

  const section = sections[active];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" aria-label="Menu" onKeyDown={onKey} className="relative flex rounded-full border border-border bg-surface p-1">
          <span
            aria-hidden
            className="absolute inset-y-1 rounded-full bg-brand transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
            style={{ left: pill.left, width: pill.width, opacity: pill.width ? 1 : 0 }}
          />
          {sections.map(({ id, label }, index) => (
            <button
              key={id}
              ref={(node) => {
                tabs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={index === active}
              aria-controls={`panel-${id}`}
              tabIndex={index === active ? 0 : -1}
              onClick={() => setActive(index)}
              className={cn(
                "relative h-10 rounded-full px-5 text-sm font-medium outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
                index === active ? "text-brand-foreground" : "text-foreground hover:text-brand",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p key={section.id} className="flex animate-value-in items-center gap-2 text-sm text-muted">
          <Clock aria-hidden className="size-4" />
          {section.hours}
        </p>
      </div>

      <ul key={section.id} id={`panel-${section.id}`} role="tabpanel" aria-labelledby={`tab-${section.id}`} className="grid gap-x-12 md:grid-cols-2">
        {section.items.map(({ name, text, price }, index) => (
          <li key={name} style={{ animationDelay: `${index * 60}ms` }} className="flex animate-option-in items-baseline gap-4 border-b border-border py-5">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h3 className="font-display text-xl leading-[26px] font-normal">{name}</h3>
              <p className="text-[15px] leading-[22px] text-muted">{text}</p>
            </div>
            <span className="shrink-0 text-[15px] font-semibold tabular-nums">{price}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
