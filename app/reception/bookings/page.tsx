import type { Metadata } from "next";
import { PortalBookings } from "@/components/ui/portal-bookings";

export const metadata: Metadata = { title: "Bookings" };

export default function Page() {
  return <PortalBookings role="receptionist" />;
}
