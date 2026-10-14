"use client";

import { BarChart3, CalendarDays, CreditCard, LayoutDashboard, Settings } from "lucide-react";
import { useState } from "react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { DetailList } from "@/components/ui/detail-list";
import { Drawer } from "@/components/ui/drawer";
import { Sidebar, type NavItem } from "@/components/ui/sidebar";

// Demo entries link to this page, so the showcase never leaves /components.
const NAV: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, href: "/components" },
  { label: "Bookings", icon: CalendarDays, children: [
    { label: "All bookings", href: "/components#sidebar-bookings" },
    { label: "Walk-in reservation", href: "/components#sidebar-walk-in" },
  ] },
  { label: "Payments", icon: CreditCard, children: [{ label: "Review queue", href: "/components#sidebar-queue" }] },
  { label: "Reports", icon: BarChart3, href: "/components#sidebar-reports" },
  { label: "Settings", icon: Settings, href: "/components#sidebar-settings" },
];

type DemoRow = { reference: string; guest: string; stay: string; status: string; total: string };
const ROWS: DemoRow[] = [
  { reference: "NFS-0001", guest: "Amina Hassan", stay: "20 Oct 2026 – 22 Oct 2026", status: "confirmed", total: "$190.00" },
  { reference: "NFS-0002", guest: "Mohamed Ali", stay: "21 Oct 2026 – 24 Oct 2026", status: "payment_submitted", total: "$285.00" },
  { reference: "NFS-0003", guest: "Hodan Warsame", stay: "23 Oct 2026 – 24 Oct 2026", status: "pending_payment", total: "$95.00" },
];
const COLUMNS: Column<DemoRow>[] = [
  { key: "reference", header: "Reference", cell: (r) => <span className="font-mono text-[13px]">{r.reference}</span> },
  { key: "guest", header: "Guest", cell: (r) => r.guest },
  { key: "stay", header: "Stay", cell: (r) => <span className="whitespace-nowrap">{r.stay}</span> },
  { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
  { key: "total", header: "Total", className: "text-right", cell: (r) => r.total },
];

export function BreadcrumbsDemo() {
  return <Breadcrumbs items={[{ label: "Administration", href: "/components" }, { label: "Payments" }, { label: "Review queue" }]} />;
}

export function SidebarDemo() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={`h-[380px] rounded-2xl border border-border bg-surface p-3 transition-[width] duration-200 ${collapsed ? "w-[68px]" : "w-64"}`}>
      <Sidebar label="Demo navigation" items={NAV} collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)} />
    </div>
  );
}

export function TableDrawerDemo() {
  const [selected, setSelected] = useState<DemoRow | null>(null);
  const [page, setPage] = useState(1);
  return (
    <div className="flex flex-col gap-3">
      <DataTable caption="Demo bookings" columns={COLUMNS} rows={ROWS} rowKey={(r) => r.reference} onRowClick={setSelected} selectedKey={selected?.reference} className="max-h-72" />
      <Pagination page={page} pageSize={3} total={9} onPage={setPage} noun="bookings" />
      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.reference ?? ""} subtitle={selected && <StatusBadge value={selected.status} />} footer={<Button size="sm" onClick={() => setSelected(null)}>Done</Button>}>
        {selected && <DetailList items={[{ label: "Guest", value: selected.guest }, { label: "Stay", value: selected.stay }, { label: "Total", value: selected.total }]} />}
      </Drawer>
    </div>
  );
}
