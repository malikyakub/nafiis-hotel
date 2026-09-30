"use client";

import { Lock, Mail } from "lucide-react";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextLink } from "@/components/ui/text-link";
import { useFormAction } from "@/components/ui/use-form-action";
import { login } from "../actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useFormAction(login);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4" noValidate>
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
      <Field
        label="Password"
        name="password"
        type="password"
        icon={Lock}
        autoComplete="current-password"
        required
      />
      <TextLink href="/forgot-password" className="-mt-2 self-end text-sm font-normal">
        Forgot password?
      </TextLink>
      <SubmitButton pending={pending} pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
