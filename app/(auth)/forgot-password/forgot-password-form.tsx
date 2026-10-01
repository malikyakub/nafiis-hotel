"use client";

import { Mail, MailCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ResultMessage } from "@/components/ui/result-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { useFormAction } from "@/components/ui/use-form-action";
import { requestPasswordReset } from "../actions";

type ForgotPasswordFormProps = { header: React.ReactNode; footer: React.ReactNode };

// Header and footer come from the page so the success view can replace the whole card.
export function ForgotPasswordForm({ header, footer }: ForgotPasswordFormProps) {
  const [state, formAction, pending] = useFormAction(requestPasswordReset);

  if (state.success) {
    return (
      <ResultMessage
        icon={MailCheck}
        title="Check your email"
        actions={
          <ButtonLink href="/login" variant="secondary" className="w-full">
            Back to sign in
          </ButtonLink>
        }
        note="The link works once and expires after an hour."
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
          label="Email"
          name="email"
          type="email"
          icon={Mail}
          autoComplete="email"
          required
          defaultValue={state.values?.email}
        />
        <SubmitButton pending={pending} pendingLabel="Sending…">
          Send reset link
        </SubmitButton>
      </form>
      {footer}
    </>
  );
}
