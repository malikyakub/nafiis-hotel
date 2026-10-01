import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Status } from "./status";

const TONES: Record<Status, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-neutral-soft text-neutral",
};

type ResultMessageProps = {
  icon: LucideIcon;
  status?: Status;
  title: string;
  children: React.ReactNode;
  // Buttons, full width and stacked.
  actions?: React.ReactNode;
  // Small print under the actions.
  note?: string;
};

// Replaces a form once it is done (or can't be used): "Check your email", "Link expired".
export function ResultMessage({ icon: Icon, status = "success", title, children, actions, note }: ResultMessageProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <span className={cn("flex size-14 items-center justify-center rounded-full", TONES[status])}>
        <Icon aria-hidden className="size-[26px]" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[28px] leading-[34px] font-normal">{title}</h1>
        <div className="text-[15px] leading-[22px] text-muted text-pretty">{children}</div>
      </div>
      {(actions || note) && (
        <div className="flex w-full flex-col gap-3 pt-1">
          {actions}
          {note && <p className="text-[13px] leading-[18px] text-muted">{note}</p>}
        </div>
      )}
    </div>
  );
}
