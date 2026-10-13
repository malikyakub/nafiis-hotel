"use server";

import { siteOrigin as configuredOrigin } from "@/lib/site-origin";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { FormState } from "@/lib/auth/form-state";
import { ROLE_HOME, safeNextPath, type AppRole } from "@/lib/auth/roles";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { createServerClient } from "@/lib/supabase/server";
import { logError } from "@/lib/log";
import { createClient } from "@supabase/supabase-js";
import { supabasePublicEnv } from "@/lib/supabase/env";

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

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const values = { email };
  if (!EMAIL_RE.test(email) || email.length > 254 || !password) return { error: "Enter your email and password.", values };
  let destination: string;
  try {
    // Authenticate without browser cookies first, then check the active profile.
    // Login never requests or sends an email verification code.
    const { url, anonKey } = supabasePublicEnv();
    const isolated = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const { data, error } = await isolated.auth.signInWithPassword({ email, password });
    if (error?.status === 429) return { error: "Too many sign-in attempts. Wait before trying again.", values };
    if (error || !data.user || !data.session) return { error: error?.code === "email_not_confirmed" ? "Complete your account registration before signing in." : "Email or password is incorrect.", values };
    const { data: profile, error: profileError } = await isolated.from("profiles").select("role,is_active")
      .eq("id", data.user.id).single<{ role: AppRole; is_active: boolean }>();
    if (profileError || !profile?.is_active || !Object.hasOwn(ROLE_HOME, profile.role)) {
      await isolated.auth.signOut({ scope: "local" });
      return { error: "This account is unavailable. Contact the hotel.", values };
    }
    const supabase = await createServerClient();
    const { error: sessionError } = await supabase.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
    if (sessionError) {
      await isolated.auth.signOut({ scope: "local" });
      return { error: "Could not complete sign-in. Please try again.", values };
    }
    destination = safeNextPath(formData.get("next")) ?? ROLE_HOME[profile.role];
  } catch (error) { return failure(error, values); }
  redirect(destination);
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
    if (error) {
      logError("auth.password-reset", error);
      return { error: "The password reset request could not be sent. Please try again or contact the project owner to check email delivery settings.", values: { email } };
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
