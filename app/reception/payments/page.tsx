import type { Metadata } from "next";
import { PortalPayments } from "@/components/ui/portal-payments";

export const metadata: Metadata = { title: "Payments" };

export default function Page() {
  return <PortalPayments role="receptionist" view="all" />;
}
