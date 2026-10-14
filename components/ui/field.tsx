import { CircleAlert, type LucideIcon } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  icon: LucideIcon;
  hint?: string;
  // Shown under the input in place of the hint, and marks the input invalid.
  error?: string;
  // Tighter padding and a smaller icon, for dense layouts like the quick booking bar.
  compact?: boolean;
  // Keeps the label for screen readers only; the placeholder should then name the field.
  hideLabel?: boolean;
};

export function Field({ label, name, icon: Icon, hint, error, compact, hideLabel, id, className, ...input }: FieldProps) {
  const inputId = id ?? name;
  const message = error ?? hint;
  const messageId = message ? `${inputId}-hint` : undefined;

  return (
    <div className={cn("group flex min-w-0 flex-col", compact ? "gap-1.5" : "gap-2")}>
      <label htmlFor={inputId} className={cn("text-[13px] leading-[18px] font-medium", hideLabel && "sr-only")}>
        {label}
      </label>
      <div className="relative">
        <Icon
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-1/2 -translate-y-1/2 transition",
            compact ? "left-3 size-4" : "left-4 size-[18px]",
            error ? "text-danger" : "text-muted group-focus-within:text-brand",
          )}
        />
        <input
          id={inputId}
          name={name}
          aria-describedby={messageId}
          aria-invalid={error ? true : undefined}
          className={cn(
            "h-11 w-full min-w-0 rounded-full border bg-surface text-foreground outline-none transition",
            compact ? "pl-8 pr-2.5 text-sm" : "pl-11 pr-[18px] text-[15px]",
            "placeholder:text-muted",
            error
              ? "border-danger ring-3 ring-danger/14"
              : "border-border-strong focus:border-brand focus:ring-3 focus:ring-brand/18",
            "disabled:cursor-not-allowed disabled:border-border disabled:bg-[color-mix(in_oklab,var(--background),var(--foreground)_4%)] disabled:text-muted",
            className,
          )}
          {...input}
        />
      </div>
      {message && (
        <p
          id={messageId}
          className={cn("flex items-center gap-1.5 text-xs", error ? "text-danger" : "text-muted")}
        >
          {error && <CircleAlert aria-hidden className="size-3.5 shrink-0" />}
          {message}
        </p>
      )}
    </div>
  );
}
