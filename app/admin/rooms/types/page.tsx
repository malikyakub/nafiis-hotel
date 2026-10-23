import type { Metadata } from "next";
import { PortalResource } from "@/components/ui/portal-resource";

export const metadata: Metadata = { title: "Room types & prices" };

export default function Page() {
  return <PortalResource resource="room_types" role="admin" />;
}
