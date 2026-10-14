import type { Metadata } from "next";
import { PortalOverview } from "@/components/ui/portal-overview";

export const metadata: Metadata = { title: "Overview" };

export default function Page() {
  return <PortalOverview role="admin" />;
}
