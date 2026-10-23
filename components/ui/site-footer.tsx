import { ArrowUp, Mail, MapPin, Phone, Plane, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { brand } from "@/lib/brand";
import { liveContact } from "@/lib/live-content";
import { ROOMS } from "@/lib/content";
import { BrandMark } from "./brand-mark";
import { ButtonLink } from "./button";
import { Container } from "./container";

const { contact } = brand;

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Explore",
    links: [
      { href: "/", label: "Home" },
      { href: "/rooms", label: "Rooms" },
      { href: "/dining", label: "Dining" },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Rooms",
    links: [...ROOMS.map((room) => ({ href: `/rooms/${room.slug}`, label: room.name })), { href: "/dining#menu", label: "Restaurant menu" }],
  },
  {
    title: "Guests",
    links: [
      { href: "/#book", label: "Book a room" },
      { href: "/#faq", label: "Questions" },
      { href: "/login", label: "Sign in" },
      { href: "/register", label: "Create an account" },
      { href: "/forgot-password", label: "Reset password" },
    ],
  },
];


const LINK = "w-fit rounded-sm text-sm text-white/75 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

export async function SiteFooter() {
  // Phone, email and address come from hotel settings (admin › Settings).
  const live = await liveContact();
  const REACH: { icon: LucideIcon; text: string; href?: string }[] = [
    { icon: MapPin, text: live.address },
    { icon: Phone, text: live.phone, href: `tel:${live.phoneHref}` },
    { icon: Mail, text: live.email, href: `mailto:${live.email}` },
    { icon: Plane, text: `${contact.airportMinutes} min from Aden Adde International` },
  ];
  return (
    <footer className="lattice bg-foreground pt-14 pb-8 text-white md:pt-20">
      <Container>
        {/* Top row: who we are, and the two things people come to the footer for. */}
        <div className="flex flex-col gap-6 border-b border-white/12 pb-10 md:flex-row md:items-end md:justify-between md:pb-14">
          <div className="flex flex-col gap-4">
            <BrandMark size="md" tone="reversed" />
            <p className="max-w-96 text-[15px] leading-[23px] text-white/70">
              {brand.name} is {brand.meaning}. Rooms, dining and a warm welcome in {brand.city}.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/#book" variant="solid-light">
              Book a room
            </ButtonLink>
            <ButtonLink href={`tel:${live.phoneHref}`} variant="ghost-light">
              <Phone aria-hidden />
              Call reception
            </ButtonLink>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-10 md:grid-cols-[repeat(3,minmax(0,1fr))_1.4fr] md:py-14">
          {COLUMNS.map(({ title, links }) => (
            <nav key={title} aria-label={title} className="flex flex-col gap-3">
              <p className="text-xs leading-4 font-semibold uppercase tracking-[0.16em] text-[color-mix(in_oklab,var(--accent)_35%,white)]">{title}</p>
              {links.map(({ href, label }) => (
                <Link key={href} href={href} className={LINK}>
                  {label}
                </Link>
              ))}
            </nav>
          ))}
          <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
            <p className="text-xs leading-4 font-semibold uppercase tracking-[0.16em] text-[color-mix(in_oklab,var(--accent)_35%,white)]">Find us</p>
            <ul className="flex flex-col gap-3">
              {REACH.map(({ icon: Icon, text, href }) => (
                <li key={text} className="flex items-start gap-2.5 text-sm text-white/75">
                  <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-white/50" />
                  {href ? (
                    <a href={href} className={LINK}>
                      {text}
                    </a>
                  ) : (
                    text
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col-reverse justify-between gap-4 border-t border-white/12 pt-6 text-[13px] leading-[18px] text-white/55 sm:flex-row sm:items-center">
          <span>
            © {new Date().getFullYear()} Nafiis Hotel · {brand.city}, {contact.country}
          </span>
          <a href="#" className={`${LINK} flex items-center gap-1.5 text-[13px]`}>
            Back to top
            <ArrowUp aria-hidden className="size-3.5" />
          </a>
        </div>
      </Container>
    </footer>
  );
}
