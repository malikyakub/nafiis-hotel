"use client";

import { Mail } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useFormAction } from "@/components/ui/use-form-action";
import { requestPasswordReset } from "../actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useFormAction(requestPasswordReset);

  if (state.success) {
    return (
      <Alert status="success" title="Check your email" className="mt-6">
        {state.success}
      </Alert>
    );
  }

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4" noValidate>
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
  );
}
