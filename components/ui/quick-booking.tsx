"use client";

import { ArrowLeft, ArrowRight, BedDouble, CalendarCheck, CalendarDays, Mail, Phone, User, UserRoundCheck, Users } from "lucide-react";
import { useActionState, useState } from "react";
import { initialFormState, type FormState } from "@/lib/auth/form-state";
import { cn } from "@/lib/cn";
import { CHECK_IN_TIMES, CHECK_OUT_TIMES, DEMO } from "@/lib/content";
import { Alert } from "./alert";
import { Button } from "./button";
import { Card } from "./card";
import { addDays, DateTimeField, isoDay, type DateTime } from "./date-time-field";
import { Field } from "./field";
import { ListboxField, type ListboxOption } from "./listbox-field";
import { SubmitButton } from "./submit-button";

type QuickBookingProps = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  rooms: ListboxOption[];
  className?: string;
};

const GUEST_OPTIONS: ListboxOption[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  value: String(n),
  label: n === 1 ? "1 guest" : `${n} guests`,
}));


const DAY_MS = 24 * 60 * 60 * 1000;

const shortDate = (day: string) =>
  new Date(`${day}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

function restore(date?: string, time?: string): DateTime | null {
  return date && time ? { date, time } : null;
}

// The neck joining check-in to check-out: fills the gap between the pills and covers the bit of
// each pill's outline it meets, so the two read as one shape splitting in two. Coordinates are
// for a 12px gap between 44px-tall pills; it stretches with the gap as check-out buds out.
function StayLink({ active }: { active: boolean }) {
  const stroke = active ? "var(--brand)" : "var(--border-strong)";
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 44"
      preserveAspectRatio="none"
      className="pointer-events-none absolute top-0 z-10 h-11 w-[calc(var(--split-gap)+4px)] overflow-visible"
      style={{ right: "calc(100% - 2px)" }}
    >
      <path d="M0 12.7 Q8 19 16 12.7 L16 31.3 Q8 25 0 31.3 Z" fill="var(--surface)" />
      <path d="M0 12.7 Q8 19 16 12.7 M16 31.3 Q8 25 0 31.3" fill="none" stroke={stroke} strokeWidth="1" vectorEffect="non-scaling-stroke" className="transition-[stroke] duration-200" />
    </svg>
  );
}

type StayErrors = Partial<Record<"check_in" | "check_out", string>>;

// Two steps in one form: the stay, then who it's for. No account needed; the guest is offered
// to save their details (account + wallet) after booking, never before.
export function QuickBooking({ action, rooms, className }: QuickBookingProps) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const [step, setStep] = useState<1 | 2>(1);
  const [today] = useState(() => isoDay(new Date()));
  const [checkIn, setCheckIn] = useState(() => restore(state.values?.check_in, state.values?.check_in_time));
  const [checkOut, setCheckOut] = useState(() => restore(state.values?.check_out, state.values?.check_out_time));
  const [guests, setGuests] = useState(state.values?.guests ?? "2");
  const [room, setRoom] = useState(state.values?.room_type ?? rooms[0]?.value ?? "");
  const [errors, setErrors] = useState<StayErrors>({});
  const [openPicker, setOpenPicker] = useState<"in" | "out" | null>(null);

  const split = checkIn !== null;
  const nights = checkIn && checkOut ? Math.round((Date.parse(checkOut.date) - Date.parse(checkIn.date)) / DAY_MS) : 0;

  function pickCheckIn(value: DateTime) {
    setCheckIn(value);
    setErrors({});
    // Check-out follows: the next day at the standard time, unless a later one is already set.
    if (!checkOut || checkOut.date <= value.date) setCheckOut({ date: addDays(value.date, 1), time: DEMO.checkOut });
  }

  function continueToDetails() {
    const next: StayErrors = {};
    if (!checkIn) next.check_in = "Choose your check-in date and time.";
    else if (checkIn.date < today) next.check_in = "Can't be in the past.";
    else if (!checkOut || checkOut.date <= checkIn.date) next.check_out = "Must be after check-in.";
    setErrors(next);
    if (Object.keys(next).length === 0) setStep(2);
  }

  const roomLabel = rooms.find((option) => option.value === room)?.label ?? "";
  const guestsLabel = GUEST_OPTIONS.find((option) => option.value === guests)?.label;

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <Card className="flex w-full flex-col gap-4 p-4 shadow-[0_24px_60px_-28px_rgb(20_32_43/0.45)] md:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="font-display text-[22px] leading-7 font-normal">
            {step === 1 ? "Book your stay" : "Who is the booking for?"}
          </h2>
          <p className="flex min-w-0 items-baseline gap-2 text-xs text-muted">
            {step === 2 && (
              <span className="truncate">
                <span className="font-medium text-foreground">
                  {checkIn && shortDate(checkIn.date)} – {checkOut && shortDate(checkOut.date)}
                </span>{" "}
                · {nights} {nights === 1 ? "night" : "nights"} · {guestsLabel} · {roomLabel}
              </span>
            )}
            <span className="shrink-0 font-semibold uppercase tracking-[0.16em] text-accent">Step {step}/2</span>
          </p>
        </div>

        <form action={formAction} noValidate className="flex flex-col gap-3">
          {/* Both steps stay in the form so one submit sends everything; `hidden` only hides one. */}
          <div hidden={step !== 1} className="grid grid-cols-2 items-start gap-3 lg:grid-cols-[minmax(0,2.3fr)_minmax(0,1fr)_minmax(0,1.25fr)_auto]">
            <div className={cn("stay-split col-span-2 lg:col-span-1", split && "is-split")}>
              <DateTimeField
                label="Check-in"
                name="check_in"
                icon={CalendarDays}
                value={checkIn}
                onChange={pickCheckIn}
                times={CHECK_IN_TIMES}
                minDate={today}
                error={errors.check_in}
                onOpenChange={(open) => setOpenPicker(open ? "in" : null)}
              />
              <div className="stay-out relative min-w-0" inert={!split}>
                <DateTimeField
                  label="Check-out"
                  name="check_out"
                  icon={CalendarCheck}
                  value={checkOut}
                  onChange={setCheckOut}
                  times={CHECK_OUT_TIMES}
                  minDate={checkIn ? addDays(checkIn.date, 1) : today}
                  rangeStart={checkIn?.date}
                  align="end"
                  error={errors.check_out}
                  onOpenChange={(open) => setOpenPicker(open ? "out" : null)}
                />
                <StayLink active={openPicker !== null} />
              </div>
            </div>
            <ListboxField label="Guests" name="guests" icon={Users} options={GUEST_OPTIONS} value={guests} onChange={setGuests} />
            <ListboxField label="Room" name="room_type" icon={BedDouble} options={rooms} value={room} onChange={setRoom} />
            <Button onClick={continueToDetails} className="col-span-2 w-full lg:col-span-1 lg:w-auto">
              Continue
              <ArrowRight aria-hidden />
            </Button>
          </div>

          <div hidden={step !== 2} className="grid grid-cols-2 items-start gap-3 lg:grid-cols-[1.2fr_1fr_1.2fr_auto]">
            <div className="col-span-2 lg:col-span-1">
              <Field
                compact
                label="Full name"
                name="full_name"
                icon={User}
                autoComplete="name"
                placeholder="Amina Hassan"
                defaultValue={state.values?.full_name}
                required
              />
            </div>
            <Field
              compact
              label="Phone"
              name="phone"
              type="tel"
              icon={Phone}
              autoComplete="tel"
              placeholder="+252 61 234 5678"
              defaultValue={state.values?.phone}
              required
            />
            <Field
              compact
              label="Email (optional)"
              name="email"
              type="email"
              icon={Mail}
              autoComplete="email"
              placeholder="you@example.com"
              defaultValue={state.values?.email}
            />
            <div className="col-span-2 flex gap-2 lg:col-span-1 lg:mt-6">
              <Button variant="ghost" onClick={() => setStep(1)} aria-label="Back to your stay" className="w-11 shrink-0 px-0">
                <ArrowLeft aria-hidden />
              </Button>
              <SubmitButton pending={pending} pendingLabel="Booking…" className="lg:w-auto">
                Book now
              </SubmitButton>
            </div>
          </div>

          {state.error && step === 2 && (
            <Alert status="info" title="Almost there">
              {state.error}
            </Alert>
          )}
        </form>
      </Card>

      <p className="flex items-center gap-2 px-2 text-center text-[13px] leading-[18px] text-muted">
        <UserRoundCheck aria-hidden className="size-4 shrink-0 text-success" />
        No account needed. After you book, you can save your details for next time.
      </p>
    </div>
  );
}
