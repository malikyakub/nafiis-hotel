import type { Metadata } from "next";
import { GuestPayments } from "@/components/ui/portal-payments";

export const metadata: Metadata = { title: "My payments" };

export default function Page() {
  return <GuestPayments />;
}
