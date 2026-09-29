import "server-only";
import { createServerClient as createSsrClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublicEnv } from "./env";

// Per-request client for server components, server actions and route handlers.
// Uses the anon key and the caller's session cookie, so every query is limited by RLS.
export async function createServerClient() {
  // Read cookies first: it marks the route as dynamic even when env is missing.
  const cookieStore = await cookies();
  const { url, anonKey } = supabasePublicEnv();

  return createSsrClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server components cannot set cookies. The session refresh in proxy.ts handles it.
        }
      },
    },
  });
}
