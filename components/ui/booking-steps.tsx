import { BedDouble, Check, CreditCard, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";

const steps = [
  { title: "Your stay", detail: "Room & dates", icon: BedDouble },
  { title: "Your details", detail: "No account required", icon: UserRound },
  { title: "Payment", detail: "Pay & upload receipt", icon: CreditCard },
];

export function BookingSteps({ current }: { current: 1 | 2 | 3 }) {
  return <ol aria-label="Booking progress" className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-background p-2 sm:gap-3 sm:p-3">
    {steps.map((step, index) => {
      const number = index + 1;
      const done = number < current;
      const active = number === current;
      const Icon = done ? Check : step.icon;
      return <li key={step.title} aria-current={active ? "step" : undefined}
        className={cn("flex min-w-0 items-center gap-2 rounded-xl px-2 py-3 sm:gap-3 sm:px-3", active ? "bg-surface text-brand shadow-sm" : "text-muted")}>
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full sm:size-10", active || done ? "bg-brand text-white" : "border border-border-strong")}><Icon className="size-4" aria-hidden /></span>
        <span className="min-w-0"><span className="block text-[10px] font-semibold uppercase tracking-wider">{done ? "Completed" : `Step ${number}`}</span><span className="block text-xs font-semibold sm:text-sm">{step.title}</span><span className="hidden text-xs text-muted md:block">{step.detail}</span></span>
      </li>;
    })}
  </ol>;
}
