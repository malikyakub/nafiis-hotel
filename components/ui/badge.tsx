import { cn } from "@/lib/cn";
import type { Status } from "./status";

const TONES: Record<Status, string> = {
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-900",
  danger: "bg-red-100 text-red-800",
  info: "bg-sky-100 text-sky-800",
  neutral: "bg-stone-200 text-stone-700",
};

type BadgeProps = { status?: Status; children: React.ReactNode; className?: string };

export function Badge({ status = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONES[status],
        className,
      )}
    >
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

// Badge for a database status value, e.g. <StatusBadge value="pending_payment" />.
export function StatusBadge({ value }: { value: string }) {
  const label = value.replaceAll("_", " ");
  return (
    <Badge status={DOMAIN_STATUS[value] ?? "neutral"} className="capitalize">
      {label}
    </Badge>
  );
}
