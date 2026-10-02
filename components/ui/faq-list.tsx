"use client";

import { Plus } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/cn";

type FaqListProps = { items: { question: string; answer: string }[]; className?: string };

// Accordion: one answer open at a time. The panel animates its height with a 0fr to 1fr grid row.
export function FaqList({ items, className }: FaqListProps) {
  const id = useId();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <ul className={cn("flex flex-col gap-3", className)}>
      {items.map(({ question, answer }, index) => {
        const isOpen = open === index;
        return (
          <li
            key={question}
            className={cn(
              "rounded-3xl border bg-surface transition-[border-color,box-shadow] duration-300",
              isOpen ? "border-brand/40 shadow-card" : "border-border hover:border-border-strong/60",
            )}
          >
            <h3>
              <button
                type="button"
                id={`${id}-q${index}`}
                aria-expanded={isOpen}
                aria-controls={`${id}-a${index}`}
                onClick={() => setOpen(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 rounded-3xl px-5 py-4 text-left text-base font-medium outline-none focus-visible:ring-2 focus-visible:ring-brand md:px-6 md:py-5 md:text-[17px]"
              >
                {question}
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full transition-all duration-300",
                    isOpen ? "rotate-45 bg-brand text-brand-foreground" : "bg-brand/8 text-brand",
                  )}
                >
                  <Plus aria-hidden className="size-4" />
                </span>
              </button>
            </h3>
            <div
              id={`${id}-a${index}`}
              role="region"
              aria-labelledby={`${id}-q${index}`}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden" inert={!isOpen}>
                <p className="px-5 pb-5 text-[15px] leading-6 text-muted md:px-6 md:pr-16">{answer}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
