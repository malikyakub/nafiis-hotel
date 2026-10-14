import type { Metadata } from "next";
import { PortalAvailability } from "@/components/ui/portal-tools";

export const metadata: Metadata = { title: "Availability" };

export default function Page() {
  return <PortalAvailability />;
}
