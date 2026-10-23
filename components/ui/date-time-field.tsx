"use client";

import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { useDismiss, usePresence } from "./use-popover";

export type DateTime = { date: string; time: string };

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

// yyyy-mm-dd in the visitor's own timezone.
export function isoDay(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

const noon = (day: string) => new Date(`${day}T12:00:00`);
export const addDays = (day: string, days: number) => isoDay(new Date(noon(day).getTime() + days * DAY_MS));
const monthOf = (day: string) => `${day.slice(0, 7)}-01`;
const addMonths = (month: string, n: number) => {
  const date = noon(month);
  date.setDate(1);
  date.setMonth(date.getMonth() + n);
  return isoDay(date);
};
const format = (day: string, options: Intl.DateTimeFormatOptions) => noon(day).toLocaleDateString("en-GB", options);

// Days shown for a month: leading blanks so the 1st lands on its weekday (weeks start Monday).
function monthGrid(month: string) {
  const first = noon(month);
  const lead = (first.getDay() + 6) % 7;
  const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return [...Array<null>(lead).fill(null), ...Array.from({ length: count }, (_, i) => addDays(month, i))];
}

type DateTimeFieldProps = {
  // Read by screen readers and shown as the placeholder; there is no visible label.
  label: string;
  // Posts `${name}` (yyyy-mm-dd) and `${name}_time` (HH:MM).
  name: string;
  icon: LucideIcon;
  value: DateTime | null;
  onChange: (value: DateTime) => void;
  // Times offered once a date is picked, as HH:MM. Ignored with dateOnly.
  times?: string[];
  // Picking a day finishes; no time step. Value time is "". Past days follow minDate.
  dateOnly?: boolean;
  minDate: string;
  // Start of a stay: days from here to the hovered or picked day are tinted as a range.
  rangeStart?: string;
  // Which edge of the pill the popover lines up with.
  align?: "start" | "end";
  error?: string;
  // Keeps the error for screen readers only, when it is also shown elsewhere (an alert).
  hideError?: boolean;
  onOpenChange?: (open: boolean) => void;
  tabIndex?: number;
  className?: string;
};

// Pill that opens a two-step popover: a calendar, then the time. Picking the time closes it.
export function DateTimeField({
  label,
  name,
  icon: Icon,
  value,
  onChange,
  times = [],
  dateOnly,
  minDate,
  rangeStart,
  align = "start",
  error,
  hideError,
  onOpenChange,
  tabIndex,
  className,
}: DateTimeFieldProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const timesRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"date" | "time">("date");
  const [draft, setDraft] = useState("");
  const [month, setMonth] = useState("");
  const [focusDay, setFocusDay] = useState("");
  const [hoverDay, setHoverDay] = useState("");
  const [direction, setDirection] = useState<"next" | "prev" | "none">("none");
  const [now, setNow] = useState(() => new Date());
  const { mounted, closing } = usePresence(open);

  const today = isoDay(now);
  const nowTime = now.toTimeString().slice(0, 5);
  const timeOpen = (day: string, time: string) => day > today || (day === today && time > nowTime);
  const dayOpen = (day: string) => day >= minDate && (dateOnly || times.some((time) => timeOpen(day, time)));

  const setOpenState = useCallback(
    (next: boolean) => {
      setOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );
  useDismiss(rootRef, open, (reason) => {
    setOpenState(false);
    if (reason === "escape") triggerRef.current?.focus({ preventScroll: true });
  });

  function show() {
    const start = value?.date && value.date >= minDate ? value.date : minDate;
    setNow(new Date());
    setDraft(value?.date ?? "");
    setMonth(monthOf(start));
    setFocusDay(start);
    setDirection("none");
    setView("date");
    setOpenState(true);
  }

  function goMonth(n: number) {
    setDirection(n > 0 ? "next" : "prev");
    setMonth((current) => addMonths(current, n));
  }

  function pickDay(day: string) {
    if (dateOnly) {
      onChange({ date: day, time: "" });
      setOpenState(false);
      triggerRef.current?.focus({ preventScroll: true });
      return;
    }
    setDraft(day);
    setFocusDay(day);
    setView("time");
  }

  function pickTime(time: string) {
    onChange({ date: draft, time });
    setOpenState(false);
    triggerRef.current?.focus({ preventScroll: true });
  }

  // Arrow keys move through days (and across months); Enter picks.
  function onGridKey(event: KeyboardEvent) {
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (!(event.key in steps)) return;
    event.preventDefault();
    const next = addDays(focusDay, steps[event.key]);
    if (next < monthOf(minDate)) return;
    if (monthOf(next) !== month) goMonth(next > month ? 1 : -1);
    setFocusDay(next);
  }

  useEffect(() => {
    if (!open || view !== "date") return;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${focusDay}"]`)?.focus({ preventScroll: true });
  }, [open, view, focusDay, month]);

  useEffect(() => {
    if (open && view === "time") timesRef.current?.querySelector<HTMLButtonElement>("button:enabled")?.focus({ preventScroll: true });
  }, [open, view]);

  const rangeEnd = rangeStart ? hoverDay || draft : "";
  const inRange = (day: string) => !!rangeStart && !!rangeEnd && day > rangeStart && day < rangeEnd;
  const pillText = value ? (
    <>
      <span className="hidden sm:inline">{format(value.date, { weekday: "short" })} </span>
      {format(value.date, { day: "numeric", month: "short" })}
      {dateOnly ? (
        <> {format(value.date, { year: "numeric" })}</>
      ) : (
        <>
          <span className="text-muted"> · </span>
          {value.time}
        </>
      )}
    </>
  ) : (
    <span className="text-muted">{label}</span>
  );

  return (
    <div ref={rootRef} className={cn("relative min-w-0", className)}>
      <input type="hidden" name={name} value={value?.date ?? ""} />
      <input type="hidden" name={`${name}_time`} value={value?.time ?? ""} />
      <button
        ref={triggerRef}
        type="button"
        tabIndex={tabIndex}
        aria-label={value ? `${label}: ${format(value.date, { weekday: "long", day: "numeric", month: "long" })}${dateOnly ? ` ${format(value.date, { year: "numeric" })}` : `, ${value.time}`}` : label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby={error ? `${id}-error` : undefined}
        onClick={() => (open ? setOpenState(false) : show())}
        className={cn(
          "flex h-11 w-full min-w-0 items-center gap-2 overflow-hidden rounded-full border bg-surface px-3 text-left text-sm whitespace-nowrap text-foreground outline-none transition",
          error
            ? "border-danger ring-3 ring-danger/14"
            : open
              ? "border-brand ring-3 ring-brand/18"
              : "border-border-strong hover:border-foreground/60 focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/18",
        )}
      >
        <Icon aria-hidden className={cn("size-4 shrink-0 transition", error ? "text-danger" : open ? "text-brand" : "text-muted")} />
        <span key={value ? `${value.date}${value.time}` : "empty"} className="min-w-0 flex-1 truncate animate-value-in">
          {pillText}
        </span>
      </button>
      {error && (
        <p id={`${id}-error`} className={cn("mt-1.5 px-3 text-xs text-danger", hideError && "sr-only")}>
          {error}
        </p>
      )}

      {mounted && (
        <div
          role="dialog"
          aria-label={label}
          className={cn(
            "absolute top-full z-50 mt-2 w-[19.5rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-border bg-surface p-3 shadow-[0_24px_50px_-20px_rgb(20_32_43/0.5)]",
            align === "start" ? "left-0 origin-top-left" : "right-0 origin-top-right",
            closing ? "pointer-events-none animate-popover-out" : "animate-popover-in",
          )}
        >
          <div className="mb-2 flex items-center justify-between px-1 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
            <span>{label}</span>
            <span className="flex items-center gap-1.5" aria-hidden>
              <span className={cn("h-1.5 rounded-full transition-all duration-300", view === "date" ? "w-4 bg-brand" : "w-1.5 bg-border-strong/50")} />
              <span className={cn("h-1.5 rounded-full transition-all duration-300", view === "time" ? "w-4 bg-brand" : "w-1.5 bg-border-strong/50")} />
            </span>
          </div>

          {view === "date" ? (
            <div key="date" className={cn(direction === "none" && "animate-view-back")}>
              <div className="mb-1 flex items-center justify-between">
                <button
                  type="button"
                  aria-label="Previous month"
                  disabled={month <= monthOf(minDate)}
                  onClick={() => goMonth(-1)}
                  className="grid size-9 place-items-center rounded-full text-foreground transition hover:bg-foreground/6 disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronLeft aria-hidden className="size-4" />
                </button>
                <p key={month} aria-live="polite" className="font-display text-lg animate-value-in">
                  {format(month, { month: "long", year: "numeric" })}
                </p>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => goMonth(1)}
                  className="grid size-9 place-items-center rounded-full text-foreground transition hover:bg-foreground/6"
                >
                  <ChevronRight aria-hidden className="size-4" />
                </button>
              </div>
              <div className="grid grid-cols-7 text-center text-[11px] font-medium text-muted" aria-hidden>
                {WEEKDAYS.map((day) => (
                  <span key={day} className="py-1.5">
                    {day}
                  </span>
                ))}
              </div>
              <div
                ref={gridRef}
                key={month}
                role="grid"
                onKeyDown={onGridKey}
                onPointerLeave={() => setHoverDay("")}
                className={cn("grid grid-cols-7 gap-y-1", direction === "next" && "animate-view-next", direction === "prev" && "animate-view-prev")}
              >
                {monthGrid(month).map((day, index) => {
                  if (!day) return <span key={`blank-${index}`} />;
                  const enabled = dayOpen(day);
                  const isPicked = day === draft;
                  const isHoverEnd = !!rangeStart && day === hoverDay && !isPicked;
                  const isStart = day === rangeStart;
                  const band = inRange(day) || (isStart && !!rangeEnd && rangeEnd > rangeStart!) || (!!rangeStart && day === rangeEnd);
                  return (
                    <div
                      key={day}
                      className={cn(
                        "relative flex h-9 justify-center",
                        band && "before:absolute before:inset-y-0 before:bg-brand/8",
                        band && (isStart ? "before:right-0 before:left-1/2" : day === rangeEnd ? "before:right-1/2 before:left-0" : "before:inset-x-0"),
                      )}
                    >
                      <button
                        type="button"
                        data-day={day}
                        tabIndex={day === focusDay ? 0 : -1}
                        disabled={!enabled}
                        aria-label={format(day, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        aria-pressed={isPicked}
                        onClick={() => pickDay(day)}
                        onPointerEnter={() => enabled && setHoverDay(day)}
                        className={cn(
                          "relative grid size-9 place-items-center rounded-full text-sm tabular-nums outline-none transition",
                          "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
                          isPicked
                            ? "bg-brand font-medium text-brand-foreground animate-pop"
                            : isStart || isHoverEnd
                              ? "bg-brand/15 font-medium text-brand"
                              : "text-foreground hover:bg-foreground/7",
                          !enabled && "pointer-events-none",
                          !enabled && !isStart && "text-muted/45",
                        )}
                      >
                        {Number(day.slice(8))}
                        {day === today && !isPicked && (
                          <span aria-hidden className="absolute bottom-1 size-1 rounded-full bg-accent" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div key="time" className="animate-view-next">
              <div className="mb-3 flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Back to the calendar"
                  onClick={() => {
                    setDirection("none");
                    setView("date");
                  }}
                  className="grid size-9 shrink-0 place-items-center rounded-full transition hover:bg-foreground/6"
                >
                  <ChevronLeft aria-hidden className="size-4" />
                </button>
                <div className="min-w-0">
                  <p className="font-display text-lg leading-6">{format(draft, { weekday: "long", day: "numeric", month: "long" })}</p>
                  <p className="text-xs text-muted">Choose a time</p>
                </div>
              </div>
              <div ref={timesRef} className="grid grid-cols-4 gap-1.5">
                {times.map((time, index) => {
                  const enabled = timeOpen(draft, time);
                  const isPicked = value?.date === draft && value.time === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={!enabled}
                      onClick={() => pickTime(time)}
                      style={{ animationDelay: `${index * 18}ms` }}
                      className={cn(
                        "h-9 rounded-full border text-sm tabular-nums outline-none transition animate-option-in",
                        "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
                        isPicked
                          ? "border-brand bg-brand font-medium text-brand-foreground"
                          : "border-border text-foreground hover:border-brand hover:bg-brand/6 hover:text-brand",
                        "disabled:pointer-events-none disabled:border-transparent disabled:text-muted/45",
                      )}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
