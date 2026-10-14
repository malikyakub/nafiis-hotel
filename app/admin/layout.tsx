import { PortalLayout } from "@/components/ui/portal-layout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout portal="admin">{children}</PortalLayout>;
}
