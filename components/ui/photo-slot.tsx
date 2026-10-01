import { Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type PhotoSlotProps = {
  label: string;
  // Art direction for the photo that will replace this slot.
  direction?: string;
  // on-brand: for use on the blue brand panels.
  tone?: "sand" | "on-brand";
  className?: string;
};

// Stands in for photography until the hotel provides owned images. Swap for next/image then.
// Size it from the parent (height, aspect-[4/3], flex-1).
export function PhotoSlot({ label, direction, tone = "sand", className }: PhotoSlotProps) {
  return (
    <figure
      className={cn(
        "lattice-soft m-0 flex flex-col justify-end overflow-hidden rounded-3xl border border-dashed p-4",
        tone === "sand" ? "border-border-strong bg-sand-dark" : "border-white/35 bg-[#2a6380]",
        className,
      )}
    >
      <figcaption className="flex items-start gap-2.5 rounded-[14px] bg-surface/92 px-3 py-2.5 text-xs">
        <ImageIcon aria-hidden className="mt-px size-4 shrink-0 text-muted" />
        <span className="flex flex-col gap-0.5">
          <span className="leading-4 font-semibold text-foreground">Photo placeholder · {label}</span>
          {direction && <span className="leading-[17px] text-muted">{direction}</span>}
        </span>
      </figcaption>
    </figure>
  );
}
