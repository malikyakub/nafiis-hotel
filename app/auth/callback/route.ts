import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth/roles";
import { logError } from "@/lib/log";
import { createServerClient } from "@/lib/supabase/server";

// Landing point for Supabase email links (sign-up confirmation, password reset).
// Exchanges the one-time code for a session cookie, then continues to ?next=.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next")) ?? "/";

  if (code) {
    try {
      const supabase = await createServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, origin));
    } catch (error) {
      logError("auth/callback", error);
    }
  }

  return NextResponse.redirect(new URL("/login?message=link-invalid", origin));
}
