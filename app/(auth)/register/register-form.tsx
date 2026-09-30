"use client";

import { Lock, Mail, Phone, User } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useFormAction } from "@/components/ui/use-form-action";
import { register } from "../actions";

export function RegisterForm() {
  const [state, formAction, pending] = useFormAction(register);

  if (state.success) {
    return (
      <Alert status="success" title="Almost done" className="mt-6">
        {state.success}
      </Alert>
    );
  }

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4" noValidate>
      <Field
        label="Full name"
        name="full_name"
        icon={User}
        autoComplete="name"
        required
        defaultValue={state.values?.full_name}
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
        label="Email"
        name="email"
        type="email"
        icon={Mail}
        autoComplete="email"
        required
        defaultValue={state.values?.email}
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
  );
}
