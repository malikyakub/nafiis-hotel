import { cn } from "@/lib/cn";

// Page-width wrapper shared by every public section, header and footer.
export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto max-w-page px-4 md:px-10", className)}>{children}</div>;
}
