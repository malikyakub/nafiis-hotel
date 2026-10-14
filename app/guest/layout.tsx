import { PortalLayout } from "@/components/ui/portal-layout";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout portal="guest">{children}</PortalLayout>;
}
