import { requireRole } from "@/lib/auth/require-role";
import { signOut } from "@/app/(auth)/actions";
import { Container } from "./container";
import { BrandMark } from "./brand-mark";
import { Button, ButtonLink } from "./button";
import { PageHeader } from "./page-header";
import { HotelPortal } from "./hotel-portal";
import { ManagementPanel } from "./management-panel";

export async function PortalPage({ role }: { role: "guest" | "admin" | "receptionist" }) {
  const { profile } = await requireRole(role);
  return <Container className="py-8 md:py-12">
    <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
      <BrandMark size="sm" />
      <div className="flex flex-wrap gap-2"><ButtonLink href="/" variant="secondary">Hotel website</ButtonLink><form action={signOut}><Button type="submit" variant="ghost">Sign out</Button></form></div>
    </header>
    <main className="space-y-8">
      <PageHeader title={role === "guest" ? "My bookings" : role === "admin" ? "Hotel administration" : "Reception"} subtitle={`Welcome${profile.full_name ? `, ${profile.full_name}` : ""}. ${role === "guest" ? "View your stays and payment receipts." : "Manage reservations and guest arrivals."}`} />
      <HotelPortal role={role} />
      {role !== "guest" && <ManagementPanel role={role} />}
    </main>
  </Container>;
}
