import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "success"
  | "warning"
  | "danger";
export type ButtonSize = "sm" | "md";

// Hover darkens solid fills by 22% so every status colour behaves the same.
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand text-brand-foreground hover:bg-[color-mix(in_oklab,var(--brand),black_22%)]",
  secondary: "border border-border bg-surface text-foreground hover:bg-foreground/5",
  ghost: "text-foreground hover:bg-foreground/5",
  success: "bg-success text-white hover:bg-[color-mix(in_oklab,var(--success),black_22%)]",
  warning: "bg-warning text-white hover:bg-[color-mix(in_oklab,var(--warning),black_22%)]",
  danger: "bg-danger text-white hover:bg-[color-mix(in_oklab,var(--danger),black_22%)]",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm [&_svg]:size-4",
  md: "h-11 px-5 text-[15px] [&_svg]:size-[18px]",
};

type StyleProps = { variant?: ButtonVariant; size?: ButtonSize; className?: string };

export function buttonClass({ variant = "primary", size = "md", className }: StyleProps = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium leading-none transition",
    "[&_svg]:shrink-0",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:cursor-not-allowed disabled:opacity-45 disabled:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & StyleProps;

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass({ variant, size, className })} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & StyleProps;

// Same look as Button, for navigation.
export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClass({ variant, size, className })} {...props} />;
}
