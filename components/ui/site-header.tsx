"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { BrandMark } from "./brand-mark";
import { ButtonLink, buttonClass } from "./button";

// Public pages from Dev Tasks TASK-11, plus Dining.
const NAV: { href: string; label: string; className?: string }[] = [
  { href: "/rooms", label: "Rooms" },
  { href: "/dining", label: "Dining" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

// Pages whose first section is a full-bleed dark hero the header can sit on (room pages included).
const OVERLAY_PATHS = new Set(["/", "/rooms", "/dining", "/about", "/contact"]);
const hasOverlay = (path: string) => OVERLAY_PATHS.has(path) || path.startsWith("/rooms/");

// Public pages only. Staff areas get their own shell.
// Over a hero it starts transparent with light text and turns solid once the page scrolls.
export function SiteHeader() {
  const pathname = usePathname();
  const overlay = hasOverlay(pathname);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDetailsElement>(null);

  // The header stays mounted across client navigations, so close the mobile menu on each one.
  useEffect(() => {
    if (menuRef.current) menuRef.current.open = false;
  }, [pathname]);

  useEffect(() => {
    if (!overlay) return;
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [overlay]);

  const clear = overlay && !scrolled;

  return (
    <header
      className={cn(
        "top-0 z-40 border-b transition-colors duration-200",
        overlay ? "fixed inset-x-0" : "sticky",
        clear ? "border-transparent bg-transparent" : "border-border bg-background/92 backdrop-blur",
      )}
    >
      <div className="mx-auto flex max-w-page items-center justify-between gap-3 px-4 py-3 md:px-10 md:py-4">
        <Link
          href="/"
          aria-label="Nafiis Hotel, home"
          className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          <BrandMark size="sm" tone={clear ? "reversed" : "color"} />
        </Link>
        <nav aria-label="Main" className="hidden gap-7 lg:flex">
          {NAV.map(({ href, label }) => {
            const current = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "group/nav relative rounded-full px-1 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2",
                  clear ? "text-white hover:text-white/75 focus-visible:ring-white" : "text-foreground hover:text-brand focus-visible:ring-brand",
                )}
              >
                {label}
                {/* Underline grows from the centre on hover and stays on the current page. */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-1 bottom-0.5 h-px origin-center rounded-full transition-transform duration-300",
                    clear ? "bg-white" : "bg-brand",
                    current ? "scale-x-100" : "scale-x-0 group-hover/nav:scale-x-100",
                  )}
                />
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <ButtonLink href="/login" variant={clear ? "ghost-light" : "ghost"} size="sm" className="hidden sm:inline-flex">
            Sign in
          </ButtonLink>
          <ButtonLink href="/#book" size="sm">
            Book a room
          </ButtonLink>
          {/* Below lg the links move into a menu. <details> needs no client JS. */}
          <details ref={menuRef} className="group relative lg:hidden">
            <summary
              aria-label="Menu"
              className={buttonClass({
                variant: clear ? "ghost-light" : "ghost",
                size: "sm",
                className: "w-9 cursor-pointer list-none px-0 [&::-webkit-details-marker]:hidden",
              })}
            >
              <Menu aria-hidden className="group-open:hidden" />
              <X aria-hidden className="hidden group-open:block" />
            </summary>
            <nav
              aria-label="Main"
              className="absolute right-0 top-full mt-2 flex w-56 origin-top-right animate-popover-in flex-col rounded-[20px] border border-border bg-surface p-2 shadow-card"
            >
              {/* Sign in is listed only where the header button is hidden (below sm). */}
              {[...NAV, { href: "/login", label: "Sign in", className: "sm:hidden" }].map(
                ({ href, label, className }) => (
                  <Link
                    key={label}
                    href={href}
                    className={cn(
                      "rounded-full px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                      className,
                    )}
                  >
                    {label}
                  </Link>
                ),
              )}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
