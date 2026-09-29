import type { InputHTMLAttributes } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  hint?: string;
};

export function Field({ label, name, hint, id, ...input }: FieldProps) {
  const inputId = id ?? name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        className="h-11 rounded-lg border border-border bg-background px-3 text-base outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        {...input}
      />
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
