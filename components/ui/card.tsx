import { cn } from "@/lib/cn";

type CardProps = { children: React.ReactNode; className?: string };

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn("rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8", className)}>
      {children}
    </div>
  );
}
