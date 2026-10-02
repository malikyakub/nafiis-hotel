import { CircleAlert, CircleCheck, CircleDot, Info, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Status } from "./status";

const TONES: Record<Status, { soft: string; border: string; icon: string; Icon: LucideIcon }> = {
  success: { soft: "bg-success-soft", border: "border-success/22", icon: "text-success", Icon: CircleCheck },
  warning: { soft: "bg-warning-soft", border: "border-warning/22", icon: "text-warning", Icon: TriangleAlert },
  danger: { soft: "bg-danger-soft", border: "border-danger/22", icon: "text-danger", Icon: CircleAlert },
  info: { soft: "bg-info-soft", border: "border-info/22", icon: "text-info", Icon: Info },
  neutral: { soft: "bg-neutral-soft", border: "border-neutral/22", icon: "text-neutral", Icon: CircleDot },
};

export type AlertProps = {
  status?: Status;
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  // inline: tinted box in the page. toast: white card with the icon in a soft circle.
  variant?: "inline" | "toast";
  className?: string;
};

// Used inline for messages that must stay on the page, and by AlertProvider for top-right alerts.
export function Alert({ status = "info", title, children, onDismiss, variant = "inline", className }: AlertProps) {
  const { soft, border, icon, Icon } = TONES[status];
  const toast = variant === "toast";
  return (
    <div
      role={status === "danger" || status === "warning" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 text-sm text-foreground",
        toast
          ? "rounded-[20px] border border-border bg-surface p-3.5 shadow-card"
          : cn("rounded-2xl border px-4 py-3.5", soft, border),
        className,
      )}
    >
      {toast ? (
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", soft, icon)}>
          <Icon aria-hidden className="size-[18px]" />
        </span>
      ) : (
        <Icon aria-hidden className={cn("size-5 shrink-0", icon)} />
      )}
      <div className={cn("min-w-0 flex-1 leading-5", toast && "pt-1.5")}>
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn(title && "mt-0.5")}>{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-my-1 -mr-1 flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </div>
  );
}
