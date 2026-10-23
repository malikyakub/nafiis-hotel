import { cn } from "@/lib/cn";

// Plain table pieces, usable from server components (e.g. the overview). For lists with row
// clicks, search and pagination use DataTable (data-table.tsx), which is built from these.

// Scroll container: the header row sticks while the body scrolls inside it.
export function TableFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("max-h-[70vh] overflow-auto rounded-2xl border border-border bg-surface", className)}>
      {children}
    </div>
  );
}

export function Table({ children, caption, className }: { children: React.ReactNode; caption?: string; className?: string }) {
  return (
    <table className={cn("w-full border-separate border-spacing-0 text-left text-sm", className)}>
      {caption && <caption className="sr-only">{caption}</caption>}
      {children}
    </table>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        "sticky top-0 z-10 border-b border-border bg-background px-4 py-3 text-xs font-semibold whitespace-nowrap text-muted",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("border-b border-border px-4 py-3 align-middle", className)}>{children}</td>;
}

// Shown in place of rows: loading, empty or an error.
export function TableMessage({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-muted">
        {children}
      </td>
    </tr>
  );
}
