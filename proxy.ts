import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabasePublicEnv } from "@/lib/supabase/env";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = supabasePublicEnv();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values, headers) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers || {}).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const required = path.startsWith("/admin") ? "admin" : path.startsWith("/reception") ? "receptionist" : path.startsWith("/restaurant") ? "restaurant_staff" : path.startsWith("/guest") ? "guest" : null;
  if (required) {
    const { data: profile } = user ? await supabase.from("profiles").select("role,is_active").eq("id", user.id).single() : { data: null };
    if (!user || !profile?.is_active || profile.role !== required) {
      const destination = request.nextUrl.clone(); destination.pathname = "/login"; destination.search = "";
      const denied = NextResponse.redirect(destination);
      response.cookies.getAll().forEach(cookie => denied.cookies.set(cookie));
      denied.headers.set("Cache-Control", "private, no-store");
      return denied;
    }
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = { matcher: ["/guest/:path*", "/admin/:path*", "/reception/:path*", "/restaurant/:path*", "/api/:path*", "/login", "/register", "/reset-password", "/auth/:path*"] };
