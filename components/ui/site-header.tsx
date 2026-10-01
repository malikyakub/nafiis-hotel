import Link from "next/link";
import { BrandMark } from "./brand-mark";
import { ButtonLink } from "./button";

const NAV = [
  { href: "/#rooms", label: "Rooms" },
  { href: "/#restaurant", label: "Restaurant" },
  { href: "/#proof", label: "Proof of Payment" },
  { href: "/#location", label: "Location" },
];

// Public pages only. Staff areas get their own shell.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3 md:px-10 md:py-4">
        <Link
          href="/"
          aria-label="Nafiis Hotel, home"
          className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          <BrandMark size="sm" />
        </Link>
        <nav aria-label="Main" className="hidden gap-7 lg:flex">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-full px-1 py-2 text-sm font-medium text-foreground transition hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <ButtonLink href="/login" variant="ghost" size="sm">
            Sign in
          </ButtonLink>
          <ButtonLink href="/login" size="sm">
            Book a room
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
