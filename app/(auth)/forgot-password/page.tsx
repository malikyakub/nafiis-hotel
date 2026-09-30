import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { TextLink } from "@/components/ui/text-link";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <PageHeader
        title="Reset your password"
        subtitle="We'll email you a link to set a new one."
      />
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm text-muted">
        <TextLink href="/login">Back to sign in</TextLink>
      </p>
    </>
  );
}
