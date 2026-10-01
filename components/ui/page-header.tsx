import { cn } from "@/lib/cn";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  // Buttons shown to the right of the title (stacked under it on small screens).
  actions?: React.ReactNode;
  // page: the page's main heading. card: smaller, for the top of a card such as the auth forms.
  size?: "page" | "card";
  className?: string;
};

export function PageHeader({ title, subtitle, actions, size = "page", className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="flex flex-col gap-1.5">
        <h1
          className={cn(
            "font-display font-normal tracking-[-0.01em] text-foreground text-balance",
            size === "page" ? "text-[28px] leading-[34px] sm:text-[40px] sm:leading-[46px]" : "text-[28px] leading-[34px]",
          )}
        >
          {title}
        </h1>
        {subtitle && <p className="text-[15px] leading-[22px] text-muted text-pretty">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>}
    </div>
  );
}
