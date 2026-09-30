import type { LucideIcon } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  icon: LucideIcon;
  hint?: string;
};

export function Field({ label, name, icon: Icon, hint, id, className, ...input }: FieldProps) {
  const inputId = id ?? name;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="pl-4 text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <Icon
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted"
        />
        <input
          id={inputId}
          name={name}
          aria-describedby={hintId}
          className={cn(
            "h-11 w-full rounded-full border border-border bg-surface pl-11 pr-4 text-base outline-none transition",
            "placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/20",
            "disabled:cursor-not-allowed disabled:opacity-60",
            className,
          )}
          {...input}
        />
      </div>
      {hint && (
        <p id={hintId} className="pl-4 text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
