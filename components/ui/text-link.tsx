import { ExternalLink } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type TextLinkProps = ComponentProps<typeof Link> & { external?: boolean };

// Inline link. external adds the external-link icon (open in a new tab yourself with target).
export function TextLink({ className, external, children, ...props }: TextLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex items-center gap-1 rounded-sm font-medium text-brand underline decoration-brand/45 decoration-1 underline-offset-3 transition",
        "hover:decoration-brand hover:decoration-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    >
      {children}
      {external && <ExternalLink aria-hidden className="size-3.5" />}
    </Link>
  );
}
