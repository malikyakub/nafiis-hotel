import { ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { CtaBand } from "@/components/ui/cta-band";
import { IconBubble } from "@/components/ui/icon-bubble";
import { PageHero } from "@/components/ui/page-hero";
import { Photo } from "@/components/ui/photo";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/cn";
import { ROOMS, SHARED_AMENITIES, usd } from "@/lib/content";
import { photos } from "@/lib/photos";
import { liveRooms } from "@/lib/live-content";

export const metadata: Metadata = {
  title: "Rooms",
  description: "Ocean rooms, garden rooms and family suites in the heart of Mogadishu.",
};

export default async function RoomsPage() {
  const ROOMS = await liveRooms();
  return (
    <>
      <PageHero
        photo={photos.oceanRoom}
        eyebrow="Rooms"
        title="Three ways to stay by the ocean"
        lead="Sea views for working trips, quiet courtyard rooms for longer stays, and a suite with space for the whole family."
      />

      {/* One row per room type, photo alternating sides. */}
      <section className="py-16 md:py-28">
        <Container className="flex flex-col gap-16 md:gap-28">
          {ROOMS.map((room, index) => (
            <article key={room.slug} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-20">
              <Reveal className={cn("group overflow-hidden rounded-[28px]", index % 2 === 1 && "lg:order-2")}>
                <Link href={`/rooms/${room.slug}`} tabIndex={-1} aria-hidden>
                  <Photo
                    photo={room.photo}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="h-72 rounded-[28px] transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.03] md:h-[460px]"
                  />
                </Link>
              </Reveal>
              <Reveal delay={1} className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <p className="text-xs leading-4 font-semibold uppercase tracking-[0.16em] text-accent">
                    {String(index + 1).padStart(2, "0")} / {String(ROOMS.length).padStart(2, "0")}
                  </p>
                  <h2 className="font-display text-[32px] leading-[38px] font-normal tracking-[-0.01em] md:text-[44px] md:leading-[50px]">{room.name}</h2>
                  <p className="max-w-[520px] text-base leading-[26px] text-muted md:text-lg md:leading-7">{room.description[0]}</p>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {room.facts.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex h-9 items-center gap-2 rounded-full border border-border bg-surface px-3.5 text-sm">
                      <Icon aria-hidden className="size-4 text-brand" />
                      {text}
                    </li>
                  ))}
                </ul>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-[15px] text-muted sm:grid-cols-3">
                  {room.amenities.slice(0, 6).map(({ text }) => (
                    <li key={text} className="flex items-center gap-2">
                      <Check aria-hidden className="size-4 shrink-0 text-success" />
                      {text}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-border pt-5">
                  <p className="text-sm text-muted">
                    From <strong className="text-xl font-semibold text-foreground">{usd(room.price)}</strong> / night
                  </p>
                  <div className="flex gap-2">
                    <ButtonLink href={`/rooms/${room.slug}`} variant="secondary">
                      Details
                    </ButtonLink>
                    <ButtonLink href={`/?room_type=${room.bookingType}#book`} aria-label={`Book the ${room.name}`}>
                      Book
                      <ArrowRight aria-hidden />
                    </ButtonLink>
                  </div>
                </div>
              </Reveal>
            </article>
          ))}
        </Container>
      </section>

      {/* What every room has. */}
      <section className="border-y border-border bg-surface py-16 md:py-24">
        <Container className="flex flex-col gap-10">
          <Reveal>
            <SectionHeading eyebrow="In every room" title="The essentials, done well" lead="Whichever room you choose, these come as standard." />
          </Reveal>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {SHARED_AMENITIES.map(({ icon, text }, index) => (
              <Reveal
                as="li"
                key={text}
                delay={index % 3}
                className="flex items-center gap-3 rounded-full border border-border bg-background py-2 pr-4 pl-2 text-[15px] transition-colors duration-300 hover:border-brand/40"
              >
                <IconBubble icon={icon} />
                {text}
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
