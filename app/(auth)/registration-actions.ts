"use server";

import { siteOrigin as configuredOrigin } from "@/lib/site-origin";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { FormState } from "@/lib/auth/form-state";
import { ROLE_HOME, safeNextPath, type AppRole } from "@/lib/auth/roles";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { createServerClient } from "@/lib/supabase/server";
import { logError } from "@/lib/log";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s-]{7,20}$/;
const MIN_PASSWORD = 8;

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

async function siteOrigin() { return configuredOrigin(await headers()); }

function failure(error: unknown, values?: Record<string, string>): FormState {
  if (error instanceof SupabaseConfigError) {
    return { error: "Sign-in is not available yet: Supabase is not configured.", values };
  }
  logError("auth", error);
  return { error: "Something went wrong. Please try again.", values };
}

export async function verifyEmailCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = text(formData, "email").toLowerCase();
  const token = text(formData, "token");
  if (!EMAIL_RE.test(email) || email.length > 254 || !/^[0-9]{6,10}$/.test(token)) return { error: "Enter the verification code from your email." };
  let destination: string;
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error || !data.user || !data.session) return { error: "The code is incorrect or expired. Try again or request a new code." };
    const { data: profile, error: profileError } = await supabase.from("profiles")
      .select("role,is_active").eq("id", data.user.id).single<{ role: AppRole; is_active: boolean }>();
    if (profileError || !profile || !profile.is_active || profile.role !== "guest") {
      await supabase.auth.signOut();
      return { error: "Registration verification is for active guest accounts only. Staff should sign in with their email and password." };
    }
    destination = safeNextPath(formData.get("next")) ?? ROLE_HOME[profile.role];
  } catch (error) { return failure(error); }
  redirect(destination);
}

export async function resendEmailCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = text(formData, "email").toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) return { error: "Enter a valid email address." };
  try {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) return { error: error.status === 429 ? "Please wait before requesting another code." : "Could not resend the code. Please try again later." };
    return { success: "A new code has been requested. Use the latest email." };
  } catch (error) { return failure(error); }
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const fullName = text(formData, "full_name");
  const phone = text(formData, "phone");
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");
  const values = { full_name: fullName, phone, email };

  if (fullName.length < 2) return { error: "Enter your full name.", field: "full_name", values };
  if (phone && !PHONE_RE.test(phone)) return { error: "Check the phone number.", field: "phone", values };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address.", field: "email", values };
  if (password.length < MIN_PASSWORD) {
    return { error: `Password must be at least ${MIN_PASSWORD} characters.`, field: "password", values };
  }
  if (password !== confirm) return { error: "Passwords do not match.", field: "confirm_password", values };


  let confirmed = false;
  try {
    const supabase = await createServerClient();
    const origin = await siteOrigin();
    // Every sign-up is a guest. The signup trigger (DB agent, TASK-8) creates
    // profile + guest + wallet and reads full_name and phone from this metadata.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${ROLE_HOME.guest}`,
        data: { full_name: fullName, phone: phone || null },
      },
    });

    if (error) {
      if (error.code === "weak_password") {
        return { error: "That password is too weak. Try a longer one.", field: "password", values };
      }
      if (error.code === "user_already_exists") {
        return { error: "An account with this email already exists. Sign in instead.", field: "email", values };
      }
      return { error: "Could not create the account. Please try again.", values };
    }

    // A session means the account is already confirmed (no email step). Keep sign-up and
    // sign-in separate: end this session and send the guest to sign in. Never a login OTP fallback.
    if (data.session) {
      await supabase.auth.signOut();
      confirmed = true;
    }
  } catch (error) {
    return failure(error, values);
  }
  if (confirmed) redirect("/login?message=account-created");

  return { success: "Check your inbox for your verification code.", verification: "signup", values: { email } };
}
