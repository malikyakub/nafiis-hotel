"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/auth/form-state";
import { updatePassword } from "../actions";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialFormState);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4" noValidate>
      <FormMessage error={state.error} />
      <Field
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        hint="At least 8 characters."
        required
      />
      <Field
        label="Confirm new password"
        name="confirm_password"
        type="password"
        autoComplete="new-password"
        required
      />
      <SubmitButton pending={pending} pendingLabel="Saving…">
        Save password
      </SubmitButton>
    </form>
  );
}
