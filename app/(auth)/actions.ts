"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { FormState } from "@/lib/auth/form-state";
import { ROLE_HOME, safeNextPath, type AppRole } from "@/lib/auth/roles";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { createServerClient } from "@/lib/supabase/server";
import { logError } from "@/lib/log";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

async function siteOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

function failure(error: unknown, values?: Record<string, string>): FormState {
  if (error instanceof SupabaseConfigError) {
    return { error: "Sign-in is not available yet: Supabase is not configured.", values };
  }
  logError("auth", error);
  return { error: "Something went wrong. Please try again.", values };
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const values = { email };

  if (!EMAIL_RE.test(email) || !password) {
    return { error: "Enter your email and password.", values };
  }

  let destination: string;
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.code === "email_not_confirmed") {
        return { error: "Confirm your email first. Check your inbox for the link.", values };
      }
      return { error: "Email or password is incorrect.", values };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", data.user.id)
      .single<{ role: AppRole; is_active: boolean }>();

    if (profile && !profile.is_active) {
      await supabase.auth.signOut();
      return { error: "This account is disabled. Contact the hotel.", values };
    }

    // No profile yet (migration 001 not applied) falls back to the home page.
    destination =
      safeNextPath(formData.get("next")) ?? (profile ? ROLE_HOME[profile.role] : "/");
  } catch (error) {
    return failure(error, values);
  }

  redirect(destination);
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const fullName = text(formData, "full_name");
  const phone = text(formData, "phone");
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");
  const values = { full_name: fullName, phone, email };

  if (fullName.length < 2) return { error: "Enter your full name.", values };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address.", values };
  if (password.length < MIN_PASSWORD) {
    return { error: `Password must be at least ${MIN_PASSWORD} characters.`, values };
  }
  if (password !== confirm) return { error: "Passwords do not match.", values };

  let signedIn = false;
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
        return { error: "That password is too weak. Try a longer one.", values };
      }
      if (error.code === "user_already_exists") {
        return { error: "An account with this email already exists. Sign in instead.", values };
      }
      return { error: "Could not create the account. Please try again.", values };
    }

    signedIn = Boolean(data.session);
  } catch (error) {
    return failure(error, values);
  }

  // Email confirmation off: already signed in. On: wait for the email link.
  if (signedIn) redirect(ROLE_HOME.guest);
  return {
    success: `Check ${email} for a confirmation link to finish creating your account.`,
  };
}

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = text(formData, "email").toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { error: "Enter a valid email address.", values: { email } };
  }

  try {
    const supabase = await createServerClient();
    const origin = await siteOrigin();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });
    if (error && error.status === 429) {
      return { error: "Too many requests. Wait a minute and try again.", values: { email } };
    }
  } catch (error) {
    return failure(error, { email });
  }

  // Same answer whether or not the account exists, so emails can't be probed.
  return { success: `If an account exists for ${email}, a reset link is on its way.` };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (password.length < MIN_PASSWORD) {
    return { error: `Password must be at least ${MIN_PASSWORD} characters.` };
  }
  if (password !== confirm) return { error: "Passwords do not match." };

  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Your reset link has expired. Request a new one." };
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      if (error.code === "same_password") {
        return { error: "Choose a password different from your current one." };
      }
      return { error: "Could not update the password. Request a new link and try again." };
    }
    await supabase.auth.signOut();
  } catch (error) {
    return failure(error);
  }

  redirect("/login?message=password-updated");
}

export async function signOut() {
  try {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
  } catch (error) {
    if (!(error instanceof SupabaseConfigError)) logError("auth", error);
  }
  redirect("/login");
}
