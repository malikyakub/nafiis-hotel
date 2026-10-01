import { brand } from "@/lib/brand";
import { cn } from "@/lib/cn";
import { MARK_LOZENGE, MARK_N, TAGLINE, WORDMARK, WORDMARK_LOZENGE } from "./brand-paths";

const SIZES = {
  sm: "w-[92px] sm:w-[104px]",
  md: "w-[148px]",
  lg: "w-[200px] sm:w-[248px]",
};

type BrandMarkProps = {
  size?: keyof typeof SIZES;
  // color: ink + coral lozenge. reversed: all white, for use on --brand only.
  tone?: "color" | "reversed";
  className?: string;
};

// Wordmark with tagline. Outlined paths, so no font is needed.
export function BrandMark({ size = "md", tone = "color", className }: BrandMarkProps) {
  const ink = tone === "reversed" ? "fill-white" : "fill-foreground";
  return (
    <svg
      viewBox="-1.5 17.8 259.4 109.8"
      role="img"
      aria-label={`${brand.name}, ${brand.tagline}`}
      className={cn("block h-auto", SIZES[size], className)}
    >
      <path className={ink} d={WORDMARK} />
      <path className={tone === "reversed" ? "fill-white" : "fill-accent"} d={WORDMARK_LOZENGE} />
      <path className={ink} d={TAGLINE} />
    </svg>
  );
}

type BrandSymbolProps = { size?: number; className?: string };

// The round "N" mark. The lozenge shows from 40px up; smaller sizes drop it, like the favicon.
export function BrandSymbol({ size = 40, className }: BrandSymbolProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={brand.name}
      className={cn("block shrink-0", className)}
    >
      <circle cx="50" cy="50" r="50" className="fill-brand" />
      <path className="fill-white" d={MARK_N} />
      {size >= 40 && <path className="fill-accent" d={MARK_LOZENGE} />}
    </svg>
  );
}
