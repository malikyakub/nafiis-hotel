import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import type { Status } from "@/components/ui/status";
import { TextLink } from "@/components/ui/text-link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const MESSAGES: Record<string, { status: Status; text: string }> = {
  "password-updated": { status: "success", text: "Password updated. Sign in with your new password." },
  "link-invalid": { status: "danger", text: "That link is invalid or has expired. Request a new one." },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { message, next } = await searchParams;
  const notice = typeof message === "string" ? MESSAGES[message] : undefined;

  return (
    <>
      <PageHeader size="card" title="Sign in" subtitle="Guests and staff sign in here." />
      {notice && (
        <Alert status={notice.status}>
          {notice.text}
        </Alert>
      )}
      <LoginForm next={typeof next === "string" ? next : undefined} />
      <p className="text-center text-sm text-muted">
        New guest? <TextLink href="/register">Create an account</TextLink>
      </p>
    </>
  );
}
