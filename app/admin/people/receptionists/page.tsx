import type { Metadata } from "next";
import { PortalReceptionists } from "@/components/ui/portal-tools";

export const metadata: Metadata = { title: "Receptionists" };

export default function Page() {
  return <PortalReceptionists />;
}
