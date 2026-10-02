import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { TextLink } from "@/components/ui/text-link";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <ForgotPasswordForm
      header={
        <PageHeader
          size="card"
          title="Reset your password"
          subtitle="We'll email you a link to set a new one."
        />
      }
      footer={
        <p className="text-center text-sm text-muted">
          <TextLink href="/login">Back to sign in</TextLink>
        </p>
      }
    />
  );
}
