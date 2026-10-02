import { ArrowUpRight, Clock, Mail, MapPin, Phone, Plane, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { FaqList } from "@/components/ui/faq-list";
import { IconBubble } from "@/components/ui/icon-bubble";
import { PageHero } from "@/components/ui/page-hero";
import { Photo } from "@/components/ui/photo";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { brand } from "@/lib/brand";
import { DEMO, FAQ } from "@/lib/content";
import { photos } from "@/lib/photos";

export const metadata: Metadata = {
  title: "Contact",
  description: `Call, email or visit ${brand.name} in ${brand.city}.`,
};

const { contact } = brand;
const address = `${contact.street}, ${contact.district}, ${brand.city}, ${contact.country}`;

const CHANNELS: { icon: LucideIcon; title: string; text: string; action: string; href: string; external?: boolean }[] = [
  { icon: Phone, title: "Call reception", text: "The fastest way to book, change a stay or arrange a pickup.", action: contact.phone, href: `tel:${contact.phoneHref}` },
  { icon: Mail, title: "Email us", text: "For group bookings, invoices and anything that can wait a day.", action: contact.email, href: `mailto:${contact.email}` },
  {
    icon: MapPin,
    title: "Visit",
    text: address,
    action: "Open in Maps",
    href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${brand.name} Hotel, ${address}`)}`,
    external: true,
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero photo={photos.city} eyebrow="Contact" title="We are here to help" lead="Call, write or come by. Reception will look after you." />

      <section className="py-16 md:py-24">
        <Container>
          <ul className="grid gap-4 md:grid-cols-3 md:gap-6">
            {CHANNELS.map(({ icon: Icon, title, text, action, href, external }, index) => (
              <Reveal as="li" key={title} delay={index}>
                <a
                  href={href}
                  {...(external && { target: "_blank", rel: "noreferrer" })}
                  className="group flex h-full flex-col gap-4 rounded-3xl border border-border bg-surface p-6 transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand md:p-7"
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-brand/8 text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-brand-foreground">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <h2 className="font-display text-[22px] leading-7 font-normal">{title}</h2>
                    <p className="text-[15px] leading-[22px] text-muted">{text}</p>
                  </div>
                  <span className="flex items-center gap-1.5 text-[15px] font-medium text-brand">
                    {action}
                    <ArrowUpRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </a>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-y border-border bg-surface py-16 md:py-24">
        <Container className="grid items-center gap-8 lg:grid-cols-2 lg:gap-20">
          <Reveal className="flex flex-col gap-6">
            <SectionHeading eyebrow="Getting here" title="Easy to find, close to everything" />
            <ul className="flex flex-col gap-3 text-[15px] leading-[22px]">
              <li className="flex items-center gap-3">
                <IconBubble icon={MapPin} />
                {address}
              </li>
              <li className="flex items-center gap-3">
                <IconBubble icon={Plane} />
                {contact.airportMinutes} minutes from Aden Adde International Airport. Pickup on request.
              </li>
              <li className="flex items-center gap-3">
                <IconBubble icon={Clock} />
                Reception open {DEMO.receptionHours}
              </li>
            </ul>
          </Reveal>
          <Reveal delay={1} className="overflow-hidden rounded-[28px]">
            <Photo photo={photos.authPanel} sizes="(min-width: 1024px) 50vw, 100vw" className="h-72 rounded-[28px] md:h-[400px]" />
          </Reveal>
        </Container>
      </section>

      <section className="py-16 md:py-28">
        <Container className="grid gap-8 lg:grid-cols-[2fr_3fr] lg:gap-20">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading eyebrow="Questions" title="Before you call" lead="You may find your answer here." />
          </Reveal>
          <Reveal delay={1}>
            <FaqList items={FAQ} />
          </Reveal>
        </Container>
      </section>
    </>
  );
}
