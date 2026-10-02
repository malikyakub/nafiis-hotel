"use client";

import { ArrowLeft, ArrowRight, Check, Lock, Mail, MailCheck, Phone, User } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ResultMessage } from "@/components/ui/result-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { useFormAction } from "@/components/ui/use-form-action";
import { cn } from "@/lib/cn";
import { register } from "../actions";

type RegisterFormProps = { header: React.ReactNode; footer: React.ReactNode };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s-]{7,20}$/;
const MIN_PASSWORD = 8;

const STEPS = [
  { title: "About you", fields: ["full_name", "phone"] },
  { title: "Your email", fields: ["email"] },
  { title: "Choose a password", fields: ["password", "confirm_password"] },
] as const;

type FieldName = (typeof STEPS)[number]["fields"][number];
type Errors = Partial<Record<FieldName, string>>;

const stepOf = (field: string) => STEPS.findIndex((step) => (step.fields as readonly string[]).includes(field));

// Same rules as register() in ../actions.ts, checked per step so mistakes show before the end.
function validate(step: number, data: FormData): Errors {
  const value = (name: FieldName) => String(data.get(name) ?? "").trim();
  const errors: Errors = {};
  if (step === 0) {
    if (value("full_name").length < 2) errors.full_name = "Enter your full name.";
    if (value("phone") && !PHONE_RE.test(value("phone"))) errors.phone = "Check the phone number.";
  }
  if (step === 1 && !EMAIL_RE.test(value("email"))) errors.email = "Enter a valid email address.";
  if (step === 2) {
    const password = String(data.get("password") ?? "");
    if (password.length < MIN_PASSWORD) errors.password = `At least ${MIN_PASSWORD} characters.`;
    else if (password !== data.get("confirm_password")) errors.confirm_password = "Passwords do not match.";
  }
  return errors;
}

// Sign-up in three short steps inside one form, so a single submit sends everything to
// register(). Header and footer come from the page so the success view can replace them.
export function RegisterForm({ header, footer }: RegisterFormProps) {
  const [state, formAction, pending] = useFormAction(register);
  const formRef = useRef<HTMLFormElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);
  const moved = useRef(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [errors, setErrors] = useState<Errors>({});
  const [email, setEmail] = useState(state.values?.email ?? "");
  // Controlled, so the live checks stay in sync and React's post-submit form reset keeps them.
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // A server error names its field: go back to that step and mark it.
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.error && state.field && stepOf(state.field) >= 0) {
      setDirection("prev");
      setStep(stepOf(state.field));
      setErrors({ [state.field]: state.error });
    }
  }

  // Focus the first input of each new step (not on first load, to avoid a scroll jump).
  useEffect(() => {
    if (!moved.current) return;
    stepsRef.current[step]?.querySelector("input")?.focus();
  }, [step]);

  function goTo(next: number) {
    moved.current = true;
    setDirection(next > step ? "next" : "prev");
    setStep(next);
  }

  function advance() {
    const data = new FormData(formRef.current!);
    const found = validate(step, data);
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      formRef.current!.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)?.focus();
      return false;
    }
    if (step === 1) setEmail(String(data.get("email")).trim());
    return true;
  }

  // Enter on steps 1 and 2 moves on instead of submitting; on the last step it submits only
  // when the passwords pass.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (!advance()) event.preventDefault();
    else if (step < STEPS.length - 1) {
      event.preventDefault();
      goTo(step + 1);
    }
  }

  if (state.success) {
    return (
      <ResultMessage
        icon={MailCheck}
        title="Almost done"
        actions={
          <ButtonLink href="/login" variant="secondary" className="w-full">
            Back to sign in
          </ButtonLink>
        }
        note="No email after a few minutes? Check spam, then try again."
      >
        {state.success}
      </ResultMessage>
    );
  }

  const isLast = step === STEPS.length - 1;
  const stepClass = (index: number) => cn("flex flex-col gap-4", index === step && (direction === "next" ? "animate-view-next" : "animate-view-prev"));

  return (
    <>
      {header}

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <p key={step} aria-live="polite" className="animate-value-in font-display text-xl leading-7">
            {STEPS[step].title}
          </p>
          <p className="shrink-0 text-xs font-semibold tracking-[0.16em] text-accent uppercase">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>
        <div aria-hidden className="grid grid-cols-3 gap-1.5">
          {STEPS.map(({ title }, index) => (
            <span key={title} className="h-1.5 overflow-hidden rounded-full bg-border">
              <span
                className="block h-full rounded-full bg-brand transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
                style={{ transform: `scaleX(${index <= step ? 1 : 0})`, transformOrigin: "left" }}
              />
            </span>
          ))}
        </div>
      </div>

      <form ref={formRef} action={formAction} onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        {/* Every step stays in the form so the final submit sends all fields; `hidden` only hides. */}
        <div ref={(node) => { stepsRef.current[0] = node; }} hidden={step !== 0} className={stepClass(0)}>
          <Field
            label="Full name"
            name="full_name"
            icon={User}
            autoComplete="name"
            required
            defaultValue={state.values?.full_name}
            error={errors.full_name}
          />
          <Field
            label="Phone"
            name="phone"
            type="tel"
            icon={Phone}
            autoComplete="tel"
            placeholder="+252 61 234 5678"
            hint="Optional. Used by reception to contact you."
            defaultValue={state.values?.phone}
            error={errors.phone}
          />
        </div>

        <div ref={(node) => { stepsRef.current[1] = node; }} hidden={step !== 1} className={stepClass(1)}>
          <Field
            label="Email"
            name="email"
            type="email"
            icon={Mail}
            autoComplete="email"
            hint="We send a link here to confirm your account."
            required
            defaultValue={state.values?.email}
            error={errors.email}
          />
        </div>

        <div ref={(node) => { stepsRef.current[2] = node; }} hidden={step !== 2} className={stepClass(2)}>
          {email && (
            <p className="flex items-center justify-between gap-3 rounded-full bg-brand/6 py-2 pr-2 pl-4 text-sm">
              <span className="min-w-0 truncate">
                Account for <strong className="font-medium">{email}</strong>
              </span>
              <button
                type="button"
                onClick={() => goTo(1)}
                className="shrink-0 rounded-full px-3 py-1 text-[13px] font-medium text-brand transition hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                Change
              </button>
            </p>
          )}
          <Field
            label="Password"
            name="password"
            type="password"
            icon={Lock}
            autoComplete="new-password"
            minLength={MIN_PASSWORD}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
          />
          <Field
            label="Confirm password"
            name="confirm_password"
            type="password"
            icon={Lock}
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            error={errors.confirm_password}
          />
          <ul className="flex flex-col gap-1.5 text-[13px]">
            <Rule met={password.length >= MIN_PASSWORD}>At least {MIN_PASSWORD} characters</Rule>
            <Rule met={password.length > 0 && password === confirm}>Passwords match</Rule>
          </ul>
        </div>

        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="ghost" onClick={() => goTo(step - 1)} aria-label="Back" className="w-11 shrink-0 px-0">
              <ArrowLeft aria-hidden />
            </Button>
          )}
          {isLast ? (
            <SubmitButton pending={pending} pendingLabel="Creating account…">
              Create account
            </SubmitButton>
          ) : (
            <Button type="submit" className="w-full">
              Continue
              <ArrowRight aria-hidden />
            </Button>
          )}
        </div>
      </form>

      {footer}
    </>
  );
}

function Rule({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <li className={cn("flex items-center gap-2 transition-colors duration-300", met ? "text-success" : "text-muted")}>
      <span
        className={cn(
          "grid size-4 place-items-center rounded-full border transition-all duration-300",
          met ? "scale-100 border-success bg-success text-white" : "scale-90 border-border-strong",
        )}
      >
        {met && <Check aria-hidden className="size-3 animate-pop" strokeWidth={3} />}
      </span>
      {children}
    </li>
  );
}
