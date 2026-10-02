import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

// Round icon chip that leads a line of text in feature lists.
export function IconBubble({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-brand", className)}>
      <Icon aria-hidden className="size-[18px]" />
    </span>
  );
}
