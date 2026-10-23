import { ChevronDown, CircleAlert, type LucideIcon } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type SelectOption = { value: string; label: string };

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  name: string;
  icon: LucideIcon;
  options: SelectOption[];
  hint?: string;
  error?: string;
  // Tighter padding and a smaller icon, for dense layouts like the quick booking bar.
  compact?: boolean;
};

// Native select styled like Field: pill, lucide icon prefix, chevron at the right.
export function SelectField({
  label,
  name,
  icon: Icon,
  options,
  hint,
  error,
  compact,
  id,
  className,
  ...select
}: SelectFieldProps) {
  const selectId = id ?? name;
  const message = error ?? hint;
  const messageId = message ? `${selectId}-hint` : undefined;

  return (
    <div className={cn("group flex min-w-0 flex-col", compact ? "gap-1.5" : "gap-2")}>
      <label htmlFor={selectId} className="text-[13px] leading-[18px] font-medium">
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
        <select
          id={selectId}
          name={name}
          aria-describedby={messageId}
          aria-invalid={error ? true : undefined}
          className={cn(
            "h-11 w-full min-w-0 appearance-none truncate rounded-full border bg-surface text-foreground outline-none transition",
            compact ? "pl-8 pr-8 text-sm" : "pl-11 pr-10 text-[15px]",
            error
              ? "border-danger ring-3 ring-danger/14"
              : "border-border-strong focus:border-brand focus:ring-3 focus:ring-brand/18",
            "disabled:cursor-not-allowed disabled:border-border disabled:text-muted",
            className,
          )}
          {...select}
        >
          {options.map(({ value, label: optionLabel }) => (
            <option key={value} value={value}>
              {optionLabel}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className={cn("pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted", compact ? "right-3" : "right-4")}
        />
      </div>
      {message && (
        <p id={messageId} className={cn("flex items-center gap-1.5 text-xs", error ? "text-danger" : "text-muted")}>
          {error && <CircleAlert aria-hidden className="size-3.5 shrink-0" />}
          {message}
        </p>
      )}
    </div>
  );
}
