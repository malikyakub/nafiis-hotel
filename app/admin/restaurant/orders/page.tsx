import type { Metadata } from "next";
import { PortalResource } from "@/components/ui/portal-resource";

export const metadata: Metadata = { title: "Restaurant orders" };

export default function Page() {
  return <PortalResource resource="food_orders" role="admin" />;
}
