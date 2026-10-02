// Mirrors the app_role enum and profiles table from Backend Architecture (migration 001, DB agent).
// Replace with generated Supabase types once the migration lands.
export type AppRole = "admin" | "receptionist" | "restaurant_staff" | "guest";

export type Profile = {
  id: string;
  role: AppRole;
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
};

export const ROLE_HOME: Record<AppRole, string> = {
  guest: "/guest",
  receptionist: "/reception",
  restaurant_staff: "/restaurant",
  admin: "/admin",
};

// Only allow same-site relative paths, so ?next= can't redirect off-site.
export function safeNextPath(next: FormDataEntryValue | string | null | undefined) {
  if (typeof next !== "string") return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  return next;
}
