import type { Metadata } from "next";
import { PortalResource } from "@/components/ui/portal-resource";

export const metadata: Metadata = { title: "Rooms" };

export default function Page() {
  return <PortalResource resource="rooms" role="admin" />;
}
