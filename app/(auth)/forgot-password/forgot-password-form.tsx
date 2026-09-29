"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/auth/form-state";
import { requestPasswordReset } from "../actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialFormState);

  if (state.success) {
    return (
      <div className="mt-6">
        <FormMessage success={state.success} />
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4" noValidate>
      <FormMessage error={state.error} />
      <Field
        label="Email"
        name="email"
        type="email"
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
