import { ArrowLeft, ArrowRight, CalendarCheck, CalendarDays, Phone } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { IconBubble } from "@/components/ui/icon-bubble";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { RoomCard } from "@/components/ui/room-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { TextLink } from "@/components/ui/text-link";
import { brand } from "@/lib/brand";
import { DEMO, roomBySlug, ROOMS, usd } from "@/lib/content";

export function generateStaticParams() {
  return ROOMS.map((room) => ({ slug: room.slug }));
}

export async function generateMetadata({ params }: PageProps<"/rooms/[slug]">): Promise<Metadata> {
  const room = roomBySlug((await params).slug);
  return room ? { title: room.name, description: room.summary } : {};
}

export default async function RoomPage({ params }: PageProps<"/rooms/[slug]">) {
  const room = roomBySlug((await params).slug);
  if (!room) notFound();
  const others = ROOMS.filter((other) => other.slug !== room.slug);

  return (
    <>
      <PageHero photo={room.photo} eyebrow="Rooms" title={room.name} lead={room.summary}>
        <ul className="flex flex-wrap gap-2">
          {room.facts.map(({ icon: Icon, text }) => (
            <li key={text} className="flex h-9 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 text-sm text-white backdrop-blur">
              <Icon aria-hidden className="size-4" />
              {text}
            </li>
          ))}
        </ul>
      </PageHero>

      <section className="py-14 md:py-24">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
          <div className="flex flex-col gap-12">
            <Reveal className="flex flex-col gap-4">
              <TextLink href="/rooms" className="flex w-fit items-center gap-1.5 text-sm">
                <ArrowLeft aria-hidden className="size-4" />
                All rooms
              </TextLink>
              {room.description.map((paragraph) => (
                <p key={paragraph} className="max-w-[640px] text-lg leading-8 text-foreground/85 first-of-type:font-display first-of-type:text-2xl first-of-type:leading-9 first-of-type:text-foreground">
                  {paragraph}
                </p>
              ))}
            </Reveal>

            <Reveal className="flex flex-col gap-6">
              <h2 className="font-display text-[28px] leading-[34px] font-normal">In the room</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {room.amenities.map(({ icon, text }) => (
                  <li key={text} className="flex items-center gap-3 rounded-full border border-border bg-surface py-2 pr-4 pl-2 text-[15px]">
                    <IconBubble icon={icon} />
                    {text}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal className="flex flex-col gap-4">
              <h2 className="font-display text-[28px] leading-[34px] font-normal">Good to know</h2>
              <dl className="grid gap-x-8 gap-y-3 text-[15px] sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <IconBubble icon={CalendarDays} />
                  <div>
                    <dt className="text-xs text-muted">Check-in</dt>
                    <dd>From {DEMO.checkIn}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <IconBubble icon={CalendarCheck} />
                  <div>
                    <dt className="text-xs text-muted">Check-out</dt>
                    <dd>By {DEMO.checkOut}</dd>
                  </div>
                </div>
              </dl>
            </Reveal>
          </div>

          {/* Booking summary: stays in view beside the details on wide screens. */}
          <Reveal delay={1} className="lg:sticky lg:top-28 lg:self-start">
            <Card className="flex flex-col gap-5">
              <div>
                <p className="text-sm text-muted">From</p>
                <p className="font-display text-[40px] leading-[46px]">
                  {usd(room.price)} <span className="font-sans text-base text-muted">/ night</span>
                </p>
              </div>
              <p className="text-[15px] leading-[22px] text-muted">{room.specs}</p>
              <div className="flex flex-col gap-2">
                <ButtonLink href="/#book">
                  Book this room
                  <ArrowRight aria-hidden />
                </ButtonLink>
                <ButtonLink href={`tel:${brand.contact.phoneHref}`} variant="ghost">
                  <Phone aria-hidden />
                  Call reception
                </ButtonLink>
              </div>
              <p className="border-t border-border pt-4 text-[13px] leading-[18px] text-muted">
                No account needed. Pay at reception or online.
              </p>
            </Card>
          </Reveal>
        </Container>
      </section>

      <section className="border-t border-border bg-surface py-16 md:py-24">
        <Container className="flex flex-col gap-10">
          <Reveal>
            <SectionHeading eyebrow="Also at Nafiis" title="Other rooms" />
          </Reveal>
          <ul className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {others.map((other, index) => (
              <Reveal as="li" key={other.slug} delay={index}>
                <RoomCard room={other} />
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
