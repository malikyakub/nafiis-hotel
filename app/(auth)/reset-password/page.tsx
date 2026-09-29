import type { Metadata } from "next";
import Link from "next/link";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { createServerClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Set new password" };

// Reached from the email link via /auth/callback, which signs the user in first.
export default async function ResetPasswordPage() {
  let hasSession = false;
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    hasSession = Boolean(user);
  } catch (error) {
    if (!(error instanceof SupabaseConfigError)) throw error;
  }

  if (!hasSession) {
    return (
      <>
        <h1 className="text-xl font-semibold">Link expired</h1>
        <p className="mt-2 text-sm text-muted">
          Open this page from the link in your reset email. Links work once and expire after an hour.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 flex h-11 items-center justify-center rounded-lg bg-brand font-medium text-brand-foreground hover:opacity-90"
        >
          Request a new link
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl font-semibold">Set a new password</h1>
      <p className="mt-1 text-sm text-muted">You&apos;ll sign in again with it afterwards.</p>
      <ResetPasswordForm />
    </>
  );
}
