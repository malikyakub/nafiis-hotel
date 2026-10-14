"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";
import { Table, TableFrame, TableMessage, Td, Th } from "./table";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  caption: string;
  columns: Column<T>[];
  rows: T[] | null;
  rowKey: (row: T) => string;
  // Opens the row's detail drawer. Clicks on buttons and links inside the row do not count.
  onRowClick?: (row: T) => void;
  selectedKey?: string | null;
  loading?: boolean;
  error?: string;
  empty?: React.ReactNode;
  className?: string;
};

// Table with a sticky header, keyboard-openable rows and loading / empty / error states.
export function DataTable<T>({ caption, columns, rows, rowKey, onRowClick, selectedKey, loading, error, empty, className }: DataTableProps<T>) {
  const open = (row: T, target: EventTarget) => {
    if (onRowClick && !(target as HTMLElement).closest("button, a, input, select, textarea, label")) onRowClick(row);
  };
  return (
    <TableFrame className={className}>
      <Table caption={caption}>
        <thead>
          <tr>
            {columns.map((column) => (
              <Th key={column.key} className={column.className}>{column.header}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {error ? (
            <TableMessage colSpan={columns.length}><span className="text-danger">{error}</span></TableMessage>
          ) : loading || !rows ? (
            <TableMessage colSpan={columns.length}><span role="status">Loading…</span></TableMessage>
          ) : rows.length === 0 ? (
            <TableMessage colSpan={columns.length}>{empty ?? "Nothing to show yet."}</TableMessage>
          ) : (
            rows.map((row) => {
              const key = rowKey(row);
              return (
                <tr
                  key={key}
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-selected={selectedKey === key || undefined}
                  onClick={(event) => open(row, event.target)}
                  onKeyDown={(event) => { if (event.key === "Enter" && event.target === event.currentTarget) open(row, event.target); }}
                  className={cn(
                    "transition-colors",
                    onRowClick && "cursor-pointer hover:bg-background focus-visible:bg-background focus-visible:outline-none",
                    selectedKey === key && "bg-brand/5",
                  )}
                >
                  {columns.map((column) => (
                    <Td key={column.key} className={column.className}>{column.cell(row)}</Td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </Table>
    </TableFrame>
  );
}

// Search box, filters and actions above a table.
export function TableToolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-end gap-3", className)}>{children}</div>;
}

export function Pagination({ page, pageSize, total, onPage, disabled, noun = "records" }: {
  page: number; pageSize: number; total: number; onPage: (page: number) => void; disabled?: boolean; noun?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
      <p>{total === 0 ? `No ${noun}` : `${first}–${last} of ${total} ${noun}`}</p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" aria-label="Previous page" className="w-9 px-0" disabled={disabled || page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft aria-hidden />
        </Button>
        <span className="tabular-nums">Page {page} of {pages}</span>
        <Button variant="secondary" size="sm" aria-label="Next page" className="w-9 px-0" disabled={disabled || page >= pages} onClick={() => onPage(page + 1)}>
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </div>
  );
}
