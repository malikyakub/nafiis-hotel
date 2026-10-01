import Link from "next/link";
import { brand } from "@/lib/brand";
import { BrandMark } from "./brand-mark";

const COLUMNS = [
  {
    title: "Hotel",
    links: [
      { href: "/#rooms", label: "Rooms" },
      { href: "/#restaurant", label: "Restaurant" },
      { href: "/#proof", label: "Proof of Payment" },
      { href: "/#location", label: "Location" },
    ],
  },
  {
    title: "Guests",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/register", label: "Create an account" },
      { href: "/forgot-password", label: "Reset password" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface pt-12 pb-8 md:pt-16">
      <div className="mx-auto max-w-[1200px] px-4 md:px-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-[2fr_1fr_1fr]">
          <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
            <BrandMark size="md" />
            <p className="max-w-80 text-sm leading-[21px] text-muted">
              {brand.name} is {brand.meaning}. Rooms, dining and verifiable payments in {brand.city}.
            </p>
          </div>
          {COLUMNS.map(({ title, links }) => (
            <nav key={title} aria-label={title} className="flex flex-col gap-2.5">
              <p className="text-xs leading-4 font-semibold uppercase tracking-[0.16em] text-muted">{title}</p>
              {links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="w-fit rounded-sm text-sm text-foreground transition hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
        <div className="mt-10 flex flex-col justify-between gap-2 border-t border-border pt-5 text-[13px] leading-[18px] text-muted sm:flex-row">
          <span>© {new Date().getFullYear()} Nafiis Hotel</span>
          <span>{brand.city}, Somalia</span>
        </div>
      </div>
    </footer>
  );
}
