import type { Metadata } from "next";
import { PortalReports } from "@/components/ui/portal-tools";

export const metadata: Metadata = { title: "Reports" };

export default function Page() {
  return <PortalReports />;
}
