import { NextResponse } from "next/server";
import { failure, sameOrigin } from "@/lib/http";
import { logError } from "@/lib/log";
import { siteOrigin } from "@/lib/site-origin";
import { createServerClient } from "@/lib/supabase/server";

// Sign-out as a route handler outside the portal paths, so the proxy's role redirect never
// blocks it: it works even when the session no longer matches the page it was posted from.
export async function POST(request: Request) {
  try {
    sameOrigin(request);
  } catch (error) {
    return failure("auth.signout", error);
  }
  try {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
  } catch (error) {
    logError("auth.signout", error);
  }
  // 303 turns the POST into a GET of the sign-in page.
  return NextResponse.redirect(new URL("/login", siteOrigin(request.headers)), 303);
}
