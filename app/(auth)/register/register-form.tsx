"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/auth/form-state";
import { register } from "../actions";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, initialFormState);

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
        label="Full name"
        name="full_name"
        autoComplete="name"
        required
        defaultValue={state.values?.full_name}
      />
      <Field
        label="Phone"
        name="phone"
        type="tel"
        autoComplete="tel"
        placeholder="+252 61 234 5678"
        hint="Optional. Used by reception to contact you."
        defaultValue={state.values?.phone}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        hint="At least 8 characters."
        required
      />
      <Field
        label="Confirm password"
        name="confirm_password"
        type="password"
        autoComplete="new-password"
        required
      />
      <SubmitButton pending={pending} pendingLabel="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
