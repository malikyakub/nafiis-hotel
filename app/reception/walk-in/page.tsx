import type { Metadata } from "next";
import { FrontDeskBooking } from "@/components/ui/front-desk-booking";

export const metadata: Metadata = { title: "Walk-in reservation" };

export default function Page() {
  return <FrontDeskBooking />;
}
