import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const MESSAGES: Record<string, { success?: string; error?: string }> = {
  "password-updated": { success: "Password updated. Sign in with your new password." },
  "link-invalid": { error: "That link is invalid or has expired. Request a new one." },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { message, next } = await searchParams;
  const notice = typeof message === "string" ? MESSAGES[message] : undefined;

  return (
    <>
      <h1 className="text-xl font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-muted">Guests and staff sign in here.</p>
      <LoginForm notice={notice} next={typeof next === "string" ? next : undefined} />
      <p className="mt-6 text-center text-sm text-muted">
        New guest?{" "}
        <Link href="/register" className="font-medium text-brand hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
