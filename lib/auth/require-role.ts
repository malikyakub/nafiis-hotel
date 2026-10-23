import "server-only";
import { createServerClient } from "@/lib/supabase/server";
import type { AppRole, Profile } from "./roles";

export class AccessError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function requireRole(...allowed: AppRole[]) {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new AccessError(401, "Sign in to continue.");
  const { data: profile, error: profileError } = await supabase.from("profiles")
    .select("id,role,full_name,phone,is_active").eq("id", user.id).single<Profile>();
  if (profileError || !profile || !profile.is_active || !allowed.includes(profile.role)) {
    throw new AccessError(403, "This account cannot perform this action.");
  }
  return { supabase, user, profile };
}
