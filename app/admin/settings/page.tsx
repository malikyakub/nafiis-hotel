import type { Metadata } from "next";
import { PortalSettings } from "@/components/ui/portal-tools";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return <PortalSettings />;
}
