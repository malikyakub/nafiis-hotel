import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "success"
  | "warning"
  | "danger"
  // For dark grounds (video hero, brand panels, the transparent header).
  | "outline-light"
  | "ghost-light"
  | "solid-light";
export type ButtonSize = "sm" | "md";

// Each variant: resting look, the colour that sweeps in on hover (--btn-fill, see .btn-sweep in
// globals.css), and the text colour once filled. Solid fills darken by 22%.
const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-brand-foreground [--btn-fill:color-mix(in_oklab,var(--brand),black_22%)]",
  secondary:
    "border border-border bg-surface text-foreground [--btn-fill:var(--brand)] hover:border-brand hover:text-brand-foreground focus-visible:text-brand-foreground",
  ghost: "text-foreground [--btn-fill:color-mix(in_oklab,var(--foreground)_7%,transparent)]",
  success: "bg-success text-white [--btn-fill:color-mix(in_oklab,var(--success),black_22%)]",
  warning: "bg-warning text-white [--btn-fill:color-mix(in_oklab,var(--warning),black_22%)]",
  danger: "bg-danger text-white [--btn-fill:color-mix(in_oklab,var(--danger),black_22%)]",
  "outline-light":
    "border border-white/70 text-white [--btn-fill:white] hover:border-white hover:text-foreground focus-visible:text-foreground",
  "ghost-light": "text-white [--btn-fill:rgb(255_255_255/0.14)]",
  // The main action on a dark ground (CTA band, footer).
  "solid-light": "bg-white text-foreground [--btn-fill:var(--sand-dark)]",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm [&_svg]:size-4",
  md: "h-11 px-5 text-[15px] [&_svg]:size-[18px]",
};

type StyleProps = { variant?: ButtonVariant; size?: ButtonSize; className?: string };

export function buttonClass({ variant = "primary", size = "md", className }: StyleProps = {}) {
  return cn(
    "btn-sweep inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium leading-none",
    "transition-colors duration-[380ms] motion-reduce:transition-none [&_svg]:shrink-0",
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
