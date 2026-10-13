import { ArrowRight, LogIn, Mail, MapPin, Phone, Plane, type LucideIcon } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { FaqList } from "@/components/ui/faq-list";
import { Gallery } from "@/components/ui/gallery";
import { HeroVideo } from "@/components/ui/hero-video";
import { IconBubble } from "@/components/ui/icon-bubble";
import { Photo } from "@/components/ui/photo";
import { QuickBooking } from "@/components/ui/quick-booking";
import { Reveal } from "@/components/ui/reveal";
import { RoomCard } from "@/components/ui/room-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { TextLink } from "@/components/ui/text-link";
import { brand } from "@/lib/brand";
import { FAQ, GALLERY, RESTAURANT_POINTS, ROOM_OPTIONS, ROOMS, STAY } from "@/lib/content";
import { photos } from "@/lib/photos";
import { requestBooking } from "./actions";
import { liveRooms } from "@/lib/live-content";

// Content (rooms, services, FAQ) lives in lib/content.ts; contact details in lib/brand.ts.
// "Book a room" links go to the quick booking card (#book) until the guest booking flow has a page.

const { contact } = brand;

const LOCATION: { icon: LucideIcon; text: React.ReactNode }[] = [
  {
    icon: MapPin,
    text: (
      <>
        {contact.street}, {contact.district}
        <br />
        {brand.city}, {contact.country}
      </>
    ),
  },
  {
    icon: Phone,
    text: (
      <a href={`tel:${contact.phoneHref}`} className="rounded-sm transition hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
        {contact.phone}
      </a>
    ),
  },
  {
    icon: Mail,
    text: (
      <a href={`mailto:${contact.email}`} className="rounded-sm transition hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
        {contact.email}
      </a>
    ),
  },
  { icon: Plane, text: `${contact.airportMinutes} minutes from Aden Adde International Airport` },
];

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const ROOM_TAKEN = "Another guest paid for the room you chose first, so your unpaid booking was cancelled. Do not send money for it. Please choose another room or dates below.";

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ROOMS = await liveRooms();
  // Set by the payment page when another guest's receipt was submitted first.
  const query = await searchParams;
  const roomTaken = query.notice === "room_taken";
  const checkIn = typeof query.check_in === "string" && DAY.test(query.check_in) ? query.check_in : null;
  const checkOut = typeof query.check_out === "string" && DAY.test(query.check_out) ? query.check_out : null;
  const initialStay = roomTaken && checkIn && checkOut ? { check_in: checkIn, check_out: checkOut } : undefined;
  return (
    <>
      {/* Hero */}
      <section className="relative isolate flex min-h-[600px] items-center overflow-hidden bg-foreground md:min-h-svh">
        <HeroVideo src="/videos/lobby.mp4" className="absolute inset-0 -z-20" />
        {/* Semi-transparent ink layer so the white text reads clearly over any frame of the video.
            Darker at the top behind the transparent header, and at the bottom where the hero ends. */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-foreground/55" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-foreground/50 via-transparent to-foreground/40" />
        <Container className="flex w-full flex-col items-center gap-5 pt-28 pb-52 text-center md:gap-6 md:pt-36 lg:pb-36">
          <p className="animate-hero-in text-xs leading-4 font-semibold uppercase tracking-[0.16em] text-[color-mix(in_oklab,var(--accent)_35%,white)]">
            Welcome to Nafiis
          </p>
          <h1 className="max-w-[820px] animate-hero-in font-display text-[40px] leading-[44px] font-normal tracking-[-0.015em] text-white text-balance [animation-delay:80ms] md:text-[64px] md:leading-[68px]">
            A precious stay on the Mogadishu coast.
          </h1>
          <p className="max-w-[560px] animate-hero-in text-base leading-[26px] text-white/85 text-pretty [animation-delay:160ms] md:text-lg md:leading-7">
            Sea-facing rooms, a kitchen that cooks to order, and a calm place to rest in the heart of the
            city. Book in a few minutes and pay the way you already do.
          </p>
          <div className="flex animate-hero-in flex-wrap justify-center gap-3 pt-1 [animation-delay:240ms]">
            <ButtonLink href="#book">
              Book a room
              <ArrowRight aria-hidden />
            </ButtonLink>
            <ButtonLink href="/login" variant="outline-light">
              <LogIn aria-hidden />
              Sign in
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* Quick booking: pulled up by half its height (--qb-overlap) so it sits half on the hero.
          Card is ~130px tall in one row (lg+), ~250px stacked below that. */}
      <section
        id="book"
        aria-label="Quick booking"
        className="relative z-10 -mt-[var(--qb-overlap)] scroll-mt-28 [--qb-overlap:125px] lg:[--qb-overlap:65px]"
      >
        <Container className="animate-hero-in [animation-delay:320ms]">
          <QuickBooking action={requestBooking} rooms={ROOM_OPTIONS} initialStay={initialStay} notice={roomTaken ? ROOM_TAKEN : undefined} />
        </Container>
      </section>

      {/* Rooms */}
      <section id="rooms" className="scroll-mt-20 pt-16 pb-16 md:pt-24 md:pb-28">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Rooms"
              title="Rest within sound of the ocean"
              lead="Three room types, each with fast Wi-Fi, air conditioning and daily housekeeping."
              action={
                <ButtonLink href="/rooms" variant="secondary" className="hidden md:inline-flex">
                  All rooms
                  <ArrowRight aria-hidden />
                </ButtonLink>
              }
            />
          </Reveal>
          <ul className="mt-7 grid gap-4 md:mt-12 md:grid-cols-3 md:gap-6">
            {ROOMS.map((room, index) => (
              <Reveal as="li" key={room.slug} delay={index}>
                <RoomCard room={room} />
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      {/* Restaurant */}
      <section id="restaurant" className="scroll-mt-20 border-y border-border bg-surface py-16 md:py-28">
        <Container className="grid items-center gap-8 lg:grid-cols-[6fr_5fr] lg:gap-[72px]">
          <Reveal className="overflow-hidden rounded-[28px]">
            <Photo photo={photos.restaurant} sizes="(min-width: 1024px) 55vw, 100vw" className="h-72 rounded-[28px] md:h-[480px]" />
          </Reveal>
          <Reveal delay={1} className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="Restaurant"
              title="Order to your table or your room"
              lead="Bariis, grilled fish from the morning catch, fresh juice and shaah. Order from your phone and it goes straight to the kitchen."
            />
            <ul className="flex flex-col gap-3">
              {RESTAURANT_POINTS.map(({ icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-[15px] leading-[22px]">
                  <IconBubble icon={icon} />
                  {text}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/dining">
                See the menu
                <ArrowRight aria-hidden />
              </ButtonLink>
              <ButtonLink href="/login" variant="secondary">
                <LogIn aria-hidden />
                Sign in to order
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Your stay */}
      <section id="stay" className="lattice scroll-mt-20 bg-brand py-16 md:py-28">
        <Container className="flex flex-col gap-10 md:gap-12">
          <Reveal>
            <SectionHeading
              tone="on-brand"
              eyebrow="Your stay"
              title="Everything taken care of."
              lead="From the airport to your room and back again, we look after the details so you can rest."
              action={
                <ButtonLink href="#book" variant="outline-light" className="hidden md:inline-flex">
                  Book a room
                  <ArrowRight aria-hidden />
                </ButtonLink>
              }
            />
          </Reveal>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {STAY.map(({ icon: Icon, title, text }, index) => (
              <Reveal
                as="li"
                key={title}
                delay={index % 3}
                className="flex gap-4 rounded-3xl border border-white/15 bg-white/[0.06] p-5 transition-colors duration-300 hover:bg-white/[0.1] md:p-6"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                  <Icon aria-hidden className="size-5" />
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-display text-xl leading-[26px] font-normal text-white">{title}</h3>
                  <p className="text-sm leading-[21px] text-[#dce5ea]">{text}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      {/* Gallery: the first seven photos; the full set with filters is on About. */}
      <section id="gallery" className="scroll-mt-20 py-16 md:py-28">
        <Container className="flex flex-col gap-8 md:gap-12">
          <Reveal>
            <SectionHeading
              eyebrow="Gallery"
              title="Take a look around"
              lead="The lobby, the rooms, the table and the city outside the door."
              action={
                <ButtonLink href="/about#gallery" variant="secondary" className="hidden md:inline-flex">
                  Full gallery
                  <ArrowRight aria-hidden />
                </ButtonLink>
              }
            />
          </Reveal>
          <Reveal delay={1}>
            <Gallery items={GALLERY.slice(0, 7)} />
          </Reveal>
          <ButtonLink href="/about#gallery" variant="secondary" className="self-start md:hidden">
            Full gallery
            <ArrowRight aria-hidden />
          </ButtonLink>
        </Container>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-t border-border py-16 md:py-28">
        <Container className="grid gap-8 lg:grid-cols-[2fr_3fr] lg:gap-20">
          <Reveal className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              eyebrow="Questions"
              title="Good to know before you come"
              lead="The things guests ask us most. Anything else, reception is a call away."
            />
            <p className="text-[15px] text-muted">
              Still wondering? <TextLink href="/contact">Contact us</TextLink>
            </p>
          </Reveal>
          <Reveal delay={1}>
            <FaqList items={FAQ} />
          </Reveal>
        </Container>
      </section>

      {/* Location */}
      <section id="location" className="scroll-mt-20 border-t border-border bg-surface py-16 md:py-28">
        <Container className="grid items-center gap-8 lg:grid-cols-2 lg:gap-20">
          <Reveal className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="Location"
              title="In the heart of Mogadishu"
              lead="Close to the coast and the city's business district, with airport pickup on request."
            />
            <ul className="flex flex-col gap-3">
              {LOCATION.map(({ icon, text }, index) => (
                <li key={index} className="flex items-center gap-3 text-[15px] leading-[22px]">
                  <IconBubble icon={icon} />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <div>
              <ButtonLink href="/contact" variant="secondary">
                Contact and directions
                <ArrowRight aria-hidden />
              </ButtonLink>
            </div>
          </Reveal>
          <Reveal delay={1} className="overflow-hidden rounded-[28px]">
            <Photo photo={photos.city} sizes="(min-width: 1024px) 50vw, 100vw" className="h-72 rounded-[28px] md:h-[440px]" />
          </Reveal>
        </Container>
      </section>
    </>
  );
}
