import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { TextLink } from "@/components/ui/text-link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <>
      <PageHeader
        title="Create a guest account"
        subtitle="Book rooms, pay, and keep your Proof of Payment."
      />
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account? <TextLink href="/login">Sign in</TextLink>
      </p>
    </>
  );
}
