import { CircleCheck, CircleDot, CircleX, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { humanize } from "@/lib/format";
import type { Status } from "./status";

const TONES: Record<Status, { className: string; Icon: LucideIcon }> = {
  success: { className: "bg-success-soft text-success", Icon: CircleCheck },
  warning: { className: "bg-warning-soft text-warning", Icon: TriangleAlert },
  danger: { className: "bg-danger-soft text-danger", Icon: CircleX },
  info: { className: "bg-info-soft text-info", Icon: Info },
  neutral: { className: "bg-neutral-soft text-neutral", Icon: CircleDot },
};

type BadgeProps = { status?: Status; children: React.ReactNode; className?: string };

export function Badge({ status = "neutral", children, className }: BadgeProps) {
  const { className: tone, Icon } = TONES[status];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full pl-2 pr-2.5 text-xs leading-none font-semibold",
        tone,
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5 shrink-0" />
      {children}
    </span>
  );
}

// Status sets from Project Overview §6, mapped to one colour each so every list agrees.
const DOMAIN_STATUS: Record<string, Status> = {
  // room
  available: "success",
  reserved: "info",
  occupied: "warning",
  cleaning: "neutral",
  maintenance: "danger",
  // booking
  pending_payment: "warning",
  payment_submitted: "info",
  under_review: "info",
  confirmed: "success",
  checked_in: "success",
  checked_out: "neutral",
  cancelled: "danger",
  completed: "neutral",
  // payment and anchoring
  submitted: "info",
  approved: "success",
  rejected: "danger",
  anchored: "success",
  failed: "danger",
  // order
  pending: "warning",
  preparing: "info",
  ready: "success",
  served: "neutral",
};

// Badge for a database status value, e.g. <StatusBadge value="pending_payment" /> reads
// "Pending payment". `label` overrides the wording, e.g. housekeeping shows "Ready" for available.
export function StatusBadge({ value, label }: { value: string; label?: string }) {
  return <Badge status={DOMAIN_STATUS[value] ?? "neutral"}>{label ?? humanize(value)}</Badge>;
}
