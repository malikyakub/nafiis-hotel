import { brand } from "@/lib/brand";
import { cn } from "@/lib/cn";

const SIZES = {
  sm: { name: "text-xl", tagline: "text-[0.625rem]" },
  md: { name: "text-3xl", tagline: "text-xs" },
  lg: { name: "text-5xl sm:text-6xl", tagline: "text-sm" },
};

type BrandMarkProps = { size?: keyof typeof SIZES; className?: string };

// Placeholder wordmark until the logo is ready (TASK-44).
export function BrandMark({ size = "md", className }: BrandMarkProps) {
  return (
    <span className={cn("inline-flex flex-col items-center text-center", className)}>
      <span className={cn("font-semibold tracking-tight text-brand", SIZES[size].name)}>
        {brand.name}
      </span>
      <span className={cn("font-medium uppercase tracking-[0.2em] text-accent", SIZES[size].tagline)}>
        {brand.tagline}
      </span>
    </span>
  );
}
