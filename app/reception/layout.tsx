import { PortalLayout } from "@/components/ui/portal-layout";

export default function ReceptionLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout portal="receptionist">{children}</PortalLayout>;
}
