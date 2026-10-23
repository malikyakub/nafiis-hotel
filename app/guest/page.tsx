import type { Metadata } from "next";
import { PortalBookings } from "@/components/ui/portal-bookings";

export const metadata: Metadata = { title: "My bookings" };

export default function Page() {
  return <PortalBookings role="guest" />;
}
