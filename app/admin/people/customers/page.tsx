import type { Metadata } from "next";
import { PortalResource } from "@/components/ui/portal-resource";

export const metadata: Metadata = { title: "Customers" };

export default function Page() {
  return <PortalResource resource="guests" role="admin" />;
}
