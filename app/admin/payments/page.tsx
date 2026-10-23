import { redirect } from "next/navigation";

// Group root: open its first page.
export default function Page() {
  redirect("/admin/payments/queue");
}
