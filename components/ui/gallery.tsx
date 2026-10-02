"use client";

import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type Dispatch, type KeyboardEvent, type PointerEvent, type SetStateAction } from "react";
import { cn } from "@/lib/cn";
import type { SitePhoto } from "@/lib/photos";

type GalleryItem = { photo: SitePhoto; category: string; caption: string };

type GalleryProps = {
  items: GalleryItem[];
  // Category chips above the grid (All + each category).
  filters?: boolean;
  className?: string;
};

// Every seven tiles fill three rows of four: one big square, two wides, four singles.
// On phones (two columns) the big one spans the row and the rest sit in pairs.
const SPANS = ["col-span-2 md:row-span-2", "", "", "md:col-span-2", "", "", "md:col-span-2"];

// Mosaic of photos that opens a full-screen viewer. Filters slide a pill between categories,
// and the tiles fade in again on each change.
export function Gallery({ items, filters, className }: GalleryProps) {
  const categories = ["All", ...new Set(items.map((item) => item.category))];
  const [filter, setFilter] = useState("All");
  const shown = filter === "All" ? items : items.filter((item) => item.category === filter);
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {filters && <FilterChips options={categories} value={filter} onChange={setFilter} />}

      <ul key={filter} className="grid grid-flow-dense auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[200px] md:auto-rows-[220px] md:grid-cols-4 md:gap-4">
        {shown.map((item, index) => (
          <li key={item.photo.src} className={cn("animate-tile-in", SPANS[index % SPANS.length])} style={{ animationDelay: `${index * 45}ms` }}>
            <button
              type="button"
              onClick={() => setOpen(index)}
              aria-label={`Open photo: ${item.caption}`}
              className="group relative block size-full overflow-hidden rounded-3xl bg-sand-dark outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Image
                src={item.photo.src}
                alt={item.photo.alt}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
              <span className="absolute inset-x-4 bottom-3.5 flex translate-y-2 items-end justify-between gap-3 text-left text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                <span className="flex flex-col">
                  <span className="text-[11px] font-semibold tracking-[0.16em] text-white/75 uppercase">{item.category}</span>
                  <span className="font-display text-lg leading-6">{item.caption}</span>
                </span>
                <Expand aria-hidden className="mb-1 size-4 shrink-0" />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Lightbox items={shown} index={open} onIndex={setOpen} />
    </div>
  );
}

function FilterChips({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState({ left: 0, width: 0 });
  const active = options.indexOf(value);

  useEffect(() => {
    const measure = () => {
      const node = refs.current[active];
      if (node) setPill({ left: node.offsetLeft, width: node.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active]);

  return (
    // Scrolls sideways on narrow phones rather than wrapping, so the pill stays on one line.
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
      <div role="group" aria-label="Filter photos" className="relative flex w-max rounded-full border border-border bg-surface p-1">
        <span
          aria-hidden
          className="absolute inset-y-1 rounded-full bg-brand transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
          style={{ left: pill.left, width: pill.width, opacity: pill.width ? 1 : 0 }}
        />
        {options.map((option, index) => (
          <button
            key={option}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            aria-pressed={option === value}
            onClick={() => onChange(option)}
            className={cn(
              "relative h-10 rounded-full px-5 text-sm font-medium whitespace-nowrap outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
              option === value ? "text-brand-foreground" : "text-foreground hover:text-brand",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

type LightboxProps = { items: GalleryItem[]; index: number | null; onIndex: Dispatch<SetStateAction<number | null>> };

// Native <dialog>: focus stays inside, Escape closes and the page behind is inert.
function Lightbox({ items, index, onIndex }: LightboxProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const swipeFrom = useRef<number | null>(null);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (index !== null && !dialog.open) {
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (index === null && dialog.open) {
      dialog.close();
    }
  }, [index]);

  const count = items.length;
  // Functional update, so quick repeated presses each move one photo.
  const go = (step: number) => {
    setDirection(step > 0 ? "next" : "prev");
    onIndex((current) => (current === null ? null : (current + step + count) % count));
  };

  function onKey(event: KeyboardEvent) {
    if (event.key === "ArrowRight") go(1);
    if (event.key === "ArrowLeft") go(-1);
  }

  function onPointerUp(event: PointerEvent) {
    if (swipeFrom.current === null) return;
    const distance = event.clientX - swipeFrom.current;
    swipeFrom.current = null;
    if (Math.abs(distance) > 50) go(distance < 0 ? 1 : -1);
  }

  const item = index === null ? null : items[index];

  return (
    <dialog
      ref={ref}
      aria-label="Photo viewer"
      onKeyDown={onKey}
      onClose={() => {
        document.documentElement.style.overflow = "";
        onIndex(null);
      }}
      // A click on the dark backdrop (the dialog itself, not its content) closes it.
      onClick={(event) => {
        if (event.target === event.currentTarget) ref.current?.close();
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-foreground/92 p-0 text-white backdrop:bg-transparent open:animate-[view-back_200ms_ease-out]"
    >
      {item && (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-8 md:py-5">
            <p className="text-sm text-white/70 tabular-nums">
              {index! + 1} / {count}
            </p>
            <button
              type="button"
              autoFocus
              onClick={() => ref.current?.close()}
              aria-label="Close"
              className="grid size-11 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>

          <div
            className="relative flex-1 touch-pan-y"
            onPointerDown={(event) => (swipeFrom.current = event.clientX)}
            onPointerUp={onPointerUp}
            onClick={(event) => {
              if (event.target === event.currentTarget) ref.current?.close();
            }}
          >
            <figure key={item.photo.src} className={cn("absolute inset-x-4 inset-y-0 md:inset-x-24", direction === "next" ? "animate-view-next" : "animate-view-prev")}>
              <Image src={item.photo.src} alt={item.photo.alt} fill sizes="100vw" className="object-contain" />
            </figure>
            {count > 1 && (
              <>
                <ViewerArrow side="left" onClick={() => go(-1)} />
                <ViewerArrow side="right" onClick={() => go(1)} />
              </>
            )}
          </div>

          <div key={item.caption} className="flex animate-value-in flex-col items-center gap-1 px-4 py-5 text-center md:py-7">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-white/60 uppercase">{item.category}</p>
            <p className="font-display text-2xl">{item.caption}</p>
          </div>
        </div>
      )}
    </dialog>
  );
}

function ViewerArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
      className={cn(
        "absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/12 backdrop-blur transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:size-12",
        side === "left" ? "left-3 md:left-8" : "right-3 md:right-8",
      )}
    >
      <Icon aria-hidden className="size-5" />
    </button>
  );
}
