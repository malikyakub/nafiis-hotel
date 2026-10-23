"use client";

import { Globe, LogOut, Menu, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { BrandMark, BrandSymbol } from "./brand-mark";
import { Breadcrumbs } from "./breadcrumbs";
import { Button, ButtonLink } from "./button";
import { Drawer } from "./drawer";
import { PORTALS, SIDEBAR_COOKIE, type Portal } from "./portal-nav";
import { findNavTrail, Sidebar } from "./sidebar";

type PortalShellProps = {
  portal: Portal;
  userName: string;
  initialCollapsed: boolean;
  signOutHref: string;
  children: React.ReactNode;
};

// Portal frame: collapsible sidebar on the left, header with title, breadcrumbs and account on top.
export function PortalShell({ portal, userName, initialCollapsed, signOutHref, children }: PortalShellProps) {
  const config = PORTALS[portal];
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { group, page } = findNavTrail(config.items, pathname);
  const title = page?.label ?? config.name;

  function toggle() {
    setCollapsed((current) => {
      const next = !current;
      // Read by the portal layout on the server, so the next page load renders at the right width.
      document.cookie = `${SIDEBAR_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
      return next;
    });
  }

  const crumbs = [
    { label: config.name, href: config.home },
    ...(group ? [{ label: group.label }] : []),
    ...(page && page.href !== config.home ? [{ label: page.label }] : []),
  ];

  return (
    <div className="flex min-h-dvh flex-1 bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 overflow-y-auto border-r border-border bg-surface p-3 transition-[width] duration-200 lg:block",
          collapsed ? "w-[68px]" : "w-64",
        )}
      >
        <Sidebar
          label={`${config.name} navigation`}
          items={config.items}
          collapsed={collapsed}
          onToggleCollapsed={toggle}
          header={collapsed ? <BrandSymbol size={28} /> : <BrandMark size="sm" />}
        />
      </aside>

      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} title={config.name} side="left" className="max-w-72">
        <Sidebar label={`${config.name} navigation`} items={config.items} onNavigate={() => setMobileOpen(false)} />
      </Drawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur md:px-6">
          <Button variant="ghost" size="sm" aria-label="Open navigation" className="w-9 px-0 lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu aria-hidden />
          </Button>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <Breadcrumbs items={crumbs} />
            <h1 className="truncate font-display text-[22px] leading-7 font-normal">{title}</h1>
          </div>
          <div className="hidden items-center gap-2 text-right sm:flex">
            <span className="flex size-9 items-center justify-center rounded-full bg-brand/10 text-brand">
              <UserRound aria-hidden className="size-[18px]" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="max-w-40 truncate text-sm font-medium">{userName}</span>
              <span className="text-xs text-muted">{config.roleLabel}</span>
            </span>
          </div>
          <ButtonLink href="/" variant="secondary" size="sm" className="hidden md:inline-flex">
            <Globe aria-hidden />
            Hotel website
          </ButtonLink>
          {/* A route handler, so signing out works even if this session no longer matches the portal. */}
          <form action={signOutHref} method="post">
            <Button type="submit" variant="ghost" size="sm">
              <LogOut aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </form>
        </header>
        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
