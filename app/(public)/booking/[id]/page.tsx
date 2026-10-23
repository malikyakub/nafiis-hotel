import { GuestPayment } from "@/components/ui/guest-payment";
import { Container } from "@/components/ui/container";
export const metadata = { title:"Booking payment", robots:{index:false,follow:false} };
export default async function BookingPaymentPage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  return <Container className="py-10 md:py-16"><GuestPayment id={id}/></Container>;
}
