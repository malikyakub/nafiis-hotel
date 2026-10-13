import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabasePublicEnv } from "./env";

// Never use this client for a customer read. Customer reads must retain RLS.
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Booking service is not configured. Contact reception.");
  return createClient(supabasePublicEnv().url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
