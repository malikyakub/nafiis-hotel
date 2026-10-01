"use client";

import { Lock, Mail, MailCheck, Phone, User } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ResultMessage } from "@/components/ui/result-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { useFormAction } from "@/components/ui/use-form-action";
import { register } from "../actions";

type RegisterFormProps = { header: React.ReactNode; footer: React.ReactNode };

// Header and footer come from the page so the success view can replace the whole card.
export function RegisterForm({ header, footer }: RegisterFormProps) {
  const [state, formAction, pending] = useFormAction(register);

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

  return (
    <>
      {header}
      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <Field
          label="Full name"
          name="full_name"
          icon={User}
          autoComplete="name"
          required
          defaultValue={state.values?.full_name}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          icon={Mail}
          autoComplete="email"
          required
          defaultValue={state.values?.email}
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
        />
        <Field
          label="Password"
          name="password"
          type="password"
          icon={Lock}
          autoComplete="new-password"
          minLength={8}
          hint="At least 8 characters."
          required
        />
        <Field
          label="Confirm password"
          name="confirm_password"
          type="password"
          icon={Lock}
          autoComplete="new-password"
          required
        />
        <SubmitButton pending={pending} pendingLabel="Creating account…">
          Create account
        </SubmitButton>
      </form>
      {footer}
    </>
  );
}
