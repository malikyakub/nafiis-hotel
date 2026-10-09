"use client";

import { KeyRound } from "lucide-react";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextLink } from "@/components/ui/text-link";
import { useFormAction } from "@/components/ui/use-form-action";
import { resendEmailCode, verifyEmailCode } from "./actions";

export function EmailCodeForm({ email, mode, next }: { email: string; mode: "login" | "signup"; next?: string }) {
  const [, verify, verifying] = useFormAction(verifyEmailCode);
  const [resendState, resend, resending] = useFormAction(resendEmailCode);
  return <div className="flex flex-col gap-4">
    <p className="text-sm text-muted">Enter the verification code sent to <strong>{email}</strong>. Check spam if it has not arrived.</p>
    <form action={verify} className="flex flex-col gap-4">
      <input type="hidden" name="email" value={email} />
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Email verification code" name="token" icon={KeyRound} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" minLength={6} maxLength={10} required autoFocus />
      <SubmitButton pending={verifying || resending} pendingLabel="Please wait…">Verify and continue</SubmitButton>
    </form>
    <form action={resend}>
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="mode" value={mode} />
      <SubmitButton pending={resending || verifying} pendingLabel="Please wait…">Resend code</SubmitButton>
    </form>
    {resendState.success && <p role="status" className="text-sm text-muted">{resendState.success}</p>}
    <TextLink href={mode === "signup" ? "/register" : "/login"} onClick={(event) => { event.preventDefault(); window.location.assign(mode === "signup" ? "/register" : "/login"); }}>Use a different email</TextLink>
  </div>;
}
