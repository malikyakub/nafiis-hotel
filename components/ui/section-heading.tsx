import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  lead?: string;
  // Shown at the right on wide screens, under the text on small ones.
  action?: React.ReactNode;
  // on-brand: light text for the blue brand sections.
  tone?: "default" | "on-brand";
  className?: string;
};

export function SectionHeading({ eyebrow, title, lead, action, tone = "default", className }: SectionHeadingProps) {
  const onBrand = tone === "on-brand";
  return (
    <div className={cn("flex flex-col gap-5 md:flex-row md:items-end md:justify-between", className)}>
      <div className="flex flex-col gap-3">
        <p
          className={cn(
            "text-xs leading-4 font-semibold uppercase tracking-[0.16em]",
            onBrand ? "text-[color-mix(in_oklab,var(--accent)_35%,white)]" : "text-accent",
          )}
        >
          {eyebrow}
        </p>
        <h2
          className={cn(
            "font-display text-[28px] leading-[34px] font-normal tracking-[-0.01em] text-balance md:text-[40px] md:leading-[46px]",
            onBrand ? "text-white" : "text-foreground",
          )}
        >
          {title}
        </h2>
        {lead && (
          <p
            className={cn(
              "max-w-[560px] text-base leading-[26px] text-pretty md:text-lg md:leading-7",
              onBrand ? "text-[#dce5ea]" : "text-muted",
            )}
          >
            {lead}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
