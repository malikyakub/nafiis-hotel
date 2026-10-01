import { cn } from "@/lib/cn";

export type DetailItem = { label: string; value: React.ReactNode; mono?: boolean };

// Label / value rows, e.g. the fields of a Proof of Payment.
export function DetailList({ items, className }: { items: DetailItem[]; className?: string }) {
  return (
    <dl className={cn("m-0 flex flex-col", className)}>
      {items.map(({ label, value, mono }) => (
        <div key={label} className="flex justify-between gap-4 border-t border-border py-2.5 text-sm leading-5">
          <dt className="text-muted">{label}</dt>
          <dd className={cn("m-0 text-right font-medium text-foreground", mono && "font-mono text-[13px]")}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
