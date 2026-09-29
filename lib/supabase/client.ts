import { createBrowserClient as createSsrBrowserClient } from "@supabase/ssr";
import { supabasePublicEnv } from "./env";

// Browser client for client components. Anon key only, limited by RLS.
// Never import server-only modules (service role, lib/chain) next to this.
export function createBrowserClient() {
  const { url, anonKey } = supabasePublicEnv();
  return createSsrBrowserClient(url, anonKey);
}
