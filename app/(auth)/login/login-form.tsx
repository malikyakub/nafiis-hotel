"use client";

import { Mail } from "lucide-react";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { EmailCodeForm } from "../email-code-form";
import { useFormAction } from "@/components/ui/use-form-action";
import { login } from "../actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useFormAction(login);
  if (state.verification && state.values?.email) return <EmailCodeForm email={state.values.email} mode={state.verification} next={next} />;

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <Field
        label="Email"
        name="email"
        type="email"
        icon={Mail}
        autoComplete="email"
        required
        defaultValue={state.values?.email}
      />
      <p className="text-sm text-muted">We will email you a verification code to sign in.</p>
      <SubmitButton pending={pending} pendingLabel="Sending code…" className="mt-1">
        Send verification code
      </SubmitButton>
    </form>
  );
}
