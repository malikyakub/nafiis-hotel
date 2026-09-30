import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
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
        <PageHeader
          title="Link expired"
          subtitle="Open this page from the link in your reset email. Links work once and expire after an hour."
        />
        <ButtonLink href="/forgot-password" className="mt-6 w-full">
          Request a new link
        </ButtonLink>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Set a new password" subtitle="You'll sign in again with it afterwards." />
      <ResetPasswordForm />
    </>
  );
}
