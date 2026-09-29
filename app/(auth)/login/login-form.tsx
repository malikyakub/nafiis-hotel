"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/auth/form-state";
import { login } from "../actions";

type LoginFormProps = {
  notice?: { success?: string; error?: string };
  next?: string;
};

export function LoginForm({ notice, next }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(login, initialFormState);
  const touched = state !== initialFormState;

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4" noValidate>
      <FormMessage {...(touched ? state : notice)} />
      {next && <input type="hidden" name="next" value={next} />}
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
        autoComplete="current-password"
        required
      />
      <Link href="/forgot-password" className="-mt-2 self-end text-sm text-brand hover:underline">
        Forgot password?
      </Link>
      <SubmitButton pending={pending} pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
