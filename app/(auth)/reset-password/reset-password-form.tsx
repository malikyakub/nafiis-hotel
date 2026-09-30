"use client";

import { Lock } from "lucide-react";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useFormAction } from "@/components/ui/use-form-action";
import { updatePassword } from "../actions";

export function ResetPasswordForm() {
  const [, formAction, pending] = useFormAction(updatePassword);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4" noValidate>
      <Field
        label="New password"
        name="password"
        type="password"
        icon={Lock}
        autoComplete="new-password"
        minLength={8}
        hint="At least 8 characters."
        required
      />
      <Field
        label="Confirm new password"
        name="confirm_password"
        type="password"
        icon={Lock}
        autoComplete="new-password"
        required
      />
      <SubmitButton pending={pending} pendingLabel="Saving…">
        Save password
      </SubmitButton>
    </form>
  );
}
