import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AccessError, requireRole } from "@/lib/auth/require-role";
import type { AppRole } from "@/lib/auth/roles";
import { PORTALS, SIDEBAR_COOKIE, type Portal } from "./portal-nav";
import { PortalShell } from "./portal-shell";

// Server half of each portal layout: checks the role once for every page below it,
// then renders the shell. The proxy already redirects other roles; this is the backstop.
export async function PortalLayout({ portal, children }: { portal: Portal; children: React.ReactNode }) {
  let name: string | null = null;
  try {
    const { profile, user } = await requireRole(portal as AppRole);
    name = profile.full_name || user.email || null;
  } catch (error) {
    if (error instanceof AccessError) redirect("/login");
    throw error;
  }
  const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "1";
  return (
    <PortalShell portal={portal} userName={name ?? PORTALS[portal].roleLabel} initialCollapsed={collapsed} signOutHref="/auth/signout">
      {children}
    </PortalShell>
  );
}
