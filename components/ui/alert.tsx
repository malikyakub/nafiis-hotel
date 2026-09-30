import { Bell, CircleAlert, CircleCheck, Info, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Status } from "./status";

const TONES: Record<Status, { box: string; icon: string; Icon: LucideIcon }> = {
  success: { box: "border-emerald-200 bg-emerald-50 text-emerald-900", icon: "text-emerald-600", Icon: CircleCheck },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-950", icon: "text-amber-600", Icon: TriangleAlert },
  danger: { box: "border-red-200 bg-red-50 text-red-900", icon: "text-red-600", Icon: CircleAlert },
  info: { box: "border-sky-200 bg-sky-50 text-sky-900", icon: "text-sky-600", Icon: Info },
  neutral: { box: "border-border bg-surface text-foreground", icon: "text-muted", Icon: Bell },
};

export type AlertProps = {
  status?: Status;
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
};

// Used inline for messages that must stay on the page, and by AlertProvider for top-right alerts.
export function Alert({ status = "info", title, children, onDismiss, className }: AlertProps) {
  const { box, icon, Icon } = TONES[status];
  return (
    <div
      role={status === "danger" || status === "warning" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm", box, className)}
    >
      <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", icon)} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn(title && "mt-0.5 opacity-90")}>{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-m-1 rounded-full p-1 opacity-60 transition hover:bg-black/5 hover:opacity-100"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </div>
  );
}
