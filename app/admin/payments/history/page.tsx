import type { Metadata } from "next";
import { PortalPayments } from "@/components/ui/portal-payments";

export const metadata: Metadata = { title: "Payment history" };

export default function Page() {
  return <PortalPayments role="admin" view="history" />;
}
