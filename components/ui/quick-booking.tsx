"use client";

import { ArrowLeft, ArrowRight, BedDouble, CalendarCheck, CalendarDays, Mail, Phone, User, UserRoundCheck, Users } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { initialFormState, type FormState } from "@/lib/auth/form-state";
import { cn } from "@/lib/cn";
import { CHECK_IN_TIMES, CHECK_OUT_TIMES, DEMO } from "@/lib/content";
import { useAlert } from "./alert-provider";
import { Button, ButtonLink } from "./button";
import { Card } from "./card";
import { addDays, DateTimeField, isoDay, type DateTime } from "./date-time-field";
import { Field } from "./field";
import { ListboxField, type ListboxOption } from "./listbox-field";
import { SubmitButton } from "./submit-button";

type QuickBookingProps = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  rooms: ListboxOption[];
  className?: string;
  /** Dates carried back when another guest paid for the chosen room first. */
  initialStay?: { check_in: string; check_out: string };
  notice?: string;
};

const GUEST_OPTIONS: ListboxOption[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  value: String(n),
  label: n === 1 ? "1 guest" : `${n} guests`,
}));

const SAVED_CONTACT_KEY = "nafiis-saved-contact-v1";

// Phone numbers are Somali: the guest types the local part, the form posts "+252 <local>".
const DIAL_CODE = "+252";
const localPhone = (phone: string) => phone.trim().replace(/^\+252\s*/, "");

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
type ShowAlert = ReturnType<typeof useAlert>;

// Optional device storage of contact details. Its outcome is an alert, never a row in the bar.
function rememberDetails(showAlert: ShowAlert, values: FormState["values"]) {
  if (!values) return;
  try {
    localStorage.setItem(SAVED_CONTACT_KEY, JSON.stringify({
      full_name: values.full_name, phone: values.phone, email: values.email,
    }));
    showAlert({ tag: "quick-booking-device", status: "success", durationMs: null, message: <><p>Details saved on this device for next time.</p>{forgetButton(showAlert)}</> });
  } catch {
    showAlert({ tag: "quick-booking-device", status: "warning", durationMs: null, message: "This browser could not save your details. Your booking is still saved." });
  }
}

function forgetDetails(showAlert: ShowAlert) {
  try {
    localStorage.removeItem(SAVED_CONTACT_KEY);
    showAlert({ tag: "quick-booking-device", status: "success", message: "Saved details removed from this device." });
  } catch {
    showAlert({ tag: "quick-booking-device", status: "warning", durationMs: null, message: "Unable to remove saved details. Use your browser's site-data settings." });
  }
}

function forgetButton(showAlert: ShowAlert) {
  return <Button size="sm" variant="secondary" className="mt-2" onClick={() => forgetDetails(showAlert)}>Forget saved details</Button>;
}

// Stay and contact details lead into the third step on the private payment page.
// No account needed; the guest is offered
// to remember their contact details on this device after booking, never before.
// Under the header the bar is one row per step; every message goes to the top-right alerts. Errors and alerts
// with actions stay until dismissed.
export function QuickBooking({ action, rooms, className, initialStay, notice }: QuickBookingProps) {
  const showAlert = useAlert();
  const [state, formAction, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const next = await action(prev, formData);
    if (next.error) showAlert({ tag: "quick-booking", status: "info", title: "Almost there", message: next.error, durationMs: null });
    if (next.success) {
      showAlert({
        tag: "quick-booking",
        status: "success",
        title: "Booking request saved",
        durationMs: null,
        message: (
          <div className="flex flex-col gap-2">
            <p>{next.success}</p>
            <p className="text-muted">
              Optional: save your name, phone and email on this device, or create an account. Avoid saving on shared computers.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => rememberDetails(showAlert, next.values)}>Save details</Button>
              <ButtonLink size="sm" variant="secondary" href="/register">Create an account</ButtonLink>
            </div>
          </div>
        ),
      });
    }
    return next;
  }, initialFormState);
  const [step, setStep] = useState<1 | 2>(1);
  const [today] = useState(() => isoDay(new Date()));
  const [checkIn, setCheckIn] = useState(() => restore(state.values?.check_in, state.values?.check_in_time)
    ?? (initialStay && initialStay.check_in >= today ? { date: initialStay.check_in, time: DEMO.checkIn } : null));
  const [checkOut, setCheckOut] = useState(() => restore(state.values?.check_out, state.values?.check_out_time)
    ?? (initialStay && initialStay.check_in >= today && initialStay.check_out > initialStay.check_in ? { date: initialStay.check_out, time: DEMO.checkOut } : null));
  const [guests, setGuests] = useState(state.values?.guests ?? "2");
  const [room, setRoom] = useState(state.values?.room_type ?? rooms[0]?.value ?? "");
  const [errors, setErrors] = useState<StayErrors>({});
  const [openPicker, setOpenPicker] = useState<"in" | "out" | null>(null);
  const [contact, setContact] = useState({ full_name: "", phone: "", email: "" });
  const [phoneFocused, setPhoneFocused] = useState(false);
  // Closes the stay error alert once the dates it complained about are fixed.
  const dismissStayError = useRef<(() => void) | null>(null);

  // Sent back from the payment page when another guest paid for the room first.
  useEffect(() => {
    if (notice) showAlert({ tag: "quick-booking-notice", status: "warning", title: "Someone else paid first", message: notice, durationMs: null });
  }, [notice, showAlert]);

  const split = checkIn !== null;

  function pickCheckIn(value: DateTime) {
    setCheckIn(value);
    setErrors({});
    dismissStayError.current?.();
    // Check-out follows: the next day at the standard time, unless a later one is already set.
    if (!checkOut || checkOut.date <= value.date) setCheckOut({ date: addDays(value.date, 1), time: DEMO.checkOut });
  }

  function continueToDetails() {
    const next: StayErrors = {};
    if (!checkIn) next.check_in = "Choose your check-in date and time.";
    else if (checkIn.date < today) next.check_in = "Can't be in the past.";
    else if (!checkOut || checkOut.date <= checkIn.date) next.check_out = "Must be after check-in.";
    setErrors(next);
    const message = next.check_in ?? next.check_out;
    if (message) {
      dismissStayError.current = showAlert({ tag: "quick-booking", status: "danger", title: next.check_in ? "Check-in" : "Check-out", message, durationMs: null });
      return;
    }
    dismissStayError.current?.();
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED_CONTACT_KEY) || "null");
      if (saved && typeof saved.full_name === "string" && typeof saved.phone === "string" && typeof saved.email === "string") {
        setContact(current => ({ full_name: current.full_name || saved.full_name.slice(0,120), phone: current.phone || localPhone(saved.phone).slice(0,30), email: current.email || saved.email.slice(0,254) }));
        showAlert({ tag: "quick-booking-device", status: "info", durationMs: null, message: <><p>Filled in with the details saved on this device.</p>{forgetButton(showAlert)}</> });
      }
    } catch { /* Optional device storage must never prevent a booking. */ }
    setStep(2);
  }

  const nights = checkIn && checkOut ? Math.round((Date.parse(checkOut.date) - Date.parse(checkIn.date)) / DAY_MS) : 0;
  const roomLabel = rooms.find((option) => option.value === room)?.label ?? "";
  const guestsLabel = GUEST_OPTIONS.find((option) => option.value === guests)?.label;
  const readyForPayment = Boolean(state.success && state.bookingId);

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <Card className="flex w-full flex-col gap-4 p-4 shadow-[0_24px_60px_-28px_rgb(20_32_43/0.45)] md:p-5">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 className="font-display text-[22px] leading-7 font-normal">
              {readyForPayment ? "Your stay is saved. Next, payment." : step === 1 ? "Choose your stay" : "Add your guest details"}
            </h2>
            <p className="text-sm text-muted">
              {readyForPayment
                ? "Pay with EVC Plus or eDahab, then upload your screenshot."
                : step === 1
                  ? "Pick your dates, guests and room. No account needed."
                  : "Reception uses these to confirm your booking and reach you."}
            </p>
          </div>
          <p className="flex min-w-0 items-baseline gap-2 text-xs text-muted">
            {step === 2 && (
              <span className="truncate">
                <span className="font-medium text-foreground">
                  {checkIn && shortDate(checkIn.date)} – {checkOut && shortDate(checkOut.date)}
                </span>{" "}
                · {nights} {nights === 1 ? "night" : "nights"} · {guestsLabel} · {roomLabel}
              </span>
            )}
            <span className="shrink-0 font-semibold uppercase tracking-[0.16em] text-accent">Step {readyForPayment ? 3 : step}/3</span>
          </p>
        </div>

        <form action={formAction} noValidate>
          {/* Both steps stay in the form so one submit sends everything; `hidden` only hides one. */}
          <div hidden={step !== 1 || readyForPayment} className="grid grid-cols-2 items-start gap-3 lg:grid-cols-[minmax(0,2.3fr)_minmax(0,1fr)_minmax(0,1.25fr)_auto]">
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
                hideError
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
                  hideError
                  onOpenChange={(open) => setOpenPicker(open ? "out" : null)}
                />
                <StayLink active={openPicker !== null} />
              </div>
            </div>
            <ListboxField label="Guests" name="guests" icon={Users} options={GUEST_OPTIONS} value={guests} onChange={setGuests} />
            <ListboxField label="Room" name="room_type" icon={BedDouble} options={rooms} value={room} onChange={setRoom} />
            <Button onClick={continueToDetails} className="col-span-2 w-full lg:col-span-1 lg:w-auto">
              Guest details
              <ArrowRight aria-hidden />
            </Button>
          </div>

          <div hidden={step !== 2 || readyForPayment} className="grid grid-cols-2 items-start gap-3 lg:grid-cols-[1.1fr_1.3fr_1.1fr_auto]">
            <div className="col-span-2 lg:col-span-1">
              <Field
                compact
                label="Full name"
                name="full_name"
                icon={User}
                autoComplete="name"
                placeholder="Amina Hassan"
                value={contact.full_name}
                onChange={event => setContact(current => ({ ...current, full_name: event.target.value }))}
                required
              />
            </div>
            {/* Dial code and number are two pills joined like check-in and check-out. */}
            <div className="col-span-2 flex min-w-0 flex-col gap-1.5 sm:col-span-1">
              <span aria-hidden className="text-[13px] leading-[18px] font-medium">Phone</span>
              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 [--split-gap:12px]">
                <span
                  aria-hidden
                  className={cn(
                    "flex h-11 items-center rounded-full border bg-surface px-3.5 text-sm font-medium text-foreground transition",
                    phoneFocused ? "border-brand" : "border-border-strong",
                  )}
                >
                  {DIAL_CODE}
                </span>
                <div className="relative min-w-0">
                  <Field
                    compact
                    hideLabel
                    label={`Phone number, after ${DIAL_CODE}`}
                    name="phone_local"
                    type="tel"
                    icon={Phone}
                    autoComplete="tel-national"
                    placeholder="61 234 5678"
                    value={contact.phone}
                    onChange={event => setContact(current => ({ ...current, phone: event.target.value }))}
                    onFocus={() => setPhoneFocused(true)}
                    onBlur={() => setPhoneFocused(false)}
                    required
                  />
                  <StayLink active={phoneFocused} />
                </div>
              </div>
              <input type="hidden" name="phone" value={localPhone(contact.phone) && `${DIAL_CODE} ${localPhone(contact.phone)}`} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Field
                compact
                label="Email (optional)"
                name="email"
                type="email"
                icon={Mail}
                autoComplete="email"
                placeholder="you@example.com"
                value={contact.email}
                onChange={event => setContact(current => ({ ...current, email: event.target.value }))}
              />
            </div>
            <div className="col-span-2 flex items-center gap-2 lg:col-span-1 lg:mt-6">
              <Button variant="ghost" onClick={() => setStep(1)} aria-label="Back to your stay" className="w-11 shrink-0 px-0">
                <ArrowLeft aria-hidden />
              </Button>
              <SubmitButton pending={pending} pendingLabel="Booking…" className="flex-1 lg:w-auto lg:flex-none">
                Save & continue
              </SubmitButton>
            </div>
          </div>
        </form>

        {readyForPayment && (
          <div className="flex justify-end">
            <ButtonLink href={`/booking/${state.bookingId}`} className="flex-1 lg:flex-none">
              Continue to payment
              <ArrowRight aria-hidden />
            </ButtonLink>
          </div>
        )}
      </Card>

      <p className="flex items-center gap-2 px-2 text-center text-[13px] leading-[18px] text-muted">
        <UserRoundCheck aria-hidden className="size-4 shrink-0 text-success" />
        No account needed. After you book, you can save your details for next time.
      </p>
    </div>
  );
}
