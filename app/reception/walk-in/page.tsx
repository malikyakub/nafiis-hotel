import type { Metadata } from "next";
import { WalkInPage } from "@/components/ui/front-desk-booking";

export const metadata: Metadata = { title: "Walk-in reservation" };

export default function Page() {
  return <WalkInPage role="receptionist" />;
}
