"use client";

import { ChevronDown, PanelLeftClose, PanelLeftOpen, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";

export type NavLink = { label: string; href: string };
// A top-level item is a link, or a group that expands to its children (an accordion).
export type NavItem = { label: string; icon: LucideIcon; href?: string; children?: NavLink[] };

type SidebarProps = {
  items: NavItem[];
  label: string;
  collapsed?: boolean;
  // Shows the collapse button. Left out in the mobile drawer, which is always expanded.
  onToggleCollapsed?: () => void;
  // Called after a link is followed, e.g. to close the mobile drawer.
  onNavigate?: () => void;
  header?: React.ReactNode;
  className?: string;
};

const itemClass = (active: boolean, collapsed: boolean) =>
  cn(
    "flex h-10 w-full min-w-0 items-center gap-3 rounded-full text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
    collapsed ? "justify-center px-0" : "px-3",
    active ? "bg-brand text-brand-foreground" : "text-foreground hover:bg-foreground/5",
  );

// Portal navigation. Collapsed, it shows icons only; a group's children open in place when expanded.
export function Sidebar({ items, label, collapsed = false, onToggleCollapsed, onNavigate, header, className }: SidebarProps) {
  const pathname = usePathname();
  // Only explicit choices are stored; otherwise the group holding the current page is open.
  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  return (
    <nav aria-label={label} className={cn("flex h-full flex-col gap-4", className)}>
      {(header || onToggleCollapsed) && (
        <div className={cn("flex items-center gap-2", collapsed ? "flex-col" : "justify-between")}>
          {header}
          {onToggleCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {collapsed ? <PanelLeftOpen aria-hidden className="size-[18px]" /> : <PanelLeftClose aria-hidden className="size-[18px]" />}
            </button>
          )}
        </div>
      )}
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          if (!item.children) {
            const active = pathname === item.href;
            return (
              <li key={item.label}>
                <Link href={item.href ?? "#"} onClick={onNavigate} aria-current={active ? "page" : undefined} title={collapsed ? item.label : undefined} className={itemClass(active, collapsed)}>
                  <Icon aria-hidden className="size-[18px] shrink-0" />
                  <span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
                </Link>
              </li>
            );
          }
          const holdsPage = item.children.some((child) => child.href === pathname);
          const open = !collapsed && (toggled[item.label] ?? holdsPage);
          const groupId = `nav-${item.label.toLowerCase().replaceAll(" ", "-")}`;
          return (
            <li key={item.label}>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={groupId}
                title={collapsed ? item.label : undefined}
                onClick={() => {
                  // Collapsed there is no room for children: expand the sidebar with this group open.
                  if (collapsed) { onToggleCollapsed?.(); setToggled((t) => ({ ...t, [item.label]: true })); }
                  else setToggled((t) => ({ ...t, [item.label]: !open }));
                }}
                className={cn(itemClass(collapsed && holdsPage, collapsed), !collapsed && holdsPage && "font-semibold")}
              >
                <Icon aria-hidden className="size-[18px] shrink-0" />
                <span className={cn("flex-1 truncate text-left", collapsed && "sr-only")}>{item.label}</span>
                {!collapsed && <ChevronDown aria-hidden className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />}
              </button>
              <ul id={groupId} hidden={!open} className="mt-1 ml-[21px] flex flex-col gap-0.5 border-l border-border pl-3">
                {item.children.map((child) => {
                  const active = pathname === child.href;
                  return (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex h-9 items-center rounded-full px-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                          active ? "bg-brand/10 font-semibold text-brand" : "text-muted hover:bg-foreground/5 hover:text-foreground",
                        )}
                      >
                        <span className="truncate">{child.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Flattens a nav tree to find a page's trail, e.g. for breadcrumbs and the header title. */
export function findNavTrail(items: NavItem[], pathname: string): { group?: NavItem; page?: NavLink } {
  for (const item of items) {
    if (item.href === pathname) return { page: { label: item.label, href: item.href } };
    const child = item.children?.find((c) => c.href === pathname);
    if (child) return { group: item, page: child };
  }
  return {};
}
