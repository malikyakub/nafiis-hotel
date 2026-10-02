import { HandHeart, ReceiptText, Smartphone, UtensilsCrossed, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { CtaBand } from "@/components/ui/cta-band";
import { Gallery } from "@/components/ui/gallery";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { brand } from "@/lib/brand";
import { DEMO, GALLERY, ROOMS } from "@/lib/content";
import { photos } from "@/lib/photos";

export const metadata: Metadata = {
  title: "About",
  description: `${brand.name} is ${brand.meaning}: a hotel in ${brand.city} built around a warm welcome.`,
};

// Copy is placeholder until the hotel signs it off. Figures come from DEMO in lib/content.ts.
const VALUES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: HandHeart, title: "A warm welcome", text: "Somali hospitality first. Reception knows your name and what you need before you ask." },
  { icon: UtensilsCrossed, title: "Cooked to order", text: "A kitchen that cooks when you order, with fish from the morning catch." },
  { icon: ReceiptText, title: "Clear bills", text: "Every room night and every meal itemised. No surprises when you leave." },
  { icon: Smartphone, title: "Simple from your phone", text: "Book, order and see your bill online, and pay the way you already do." },
];

const NUMBERS = [
  { value: String(ROOMS.length), label: "Room types" },
  { value: String(DEMO.totalRooms), label: "Rooms" },
  { value: `${brand.contact.airportMinutes} min`, label: "From the airport" },
  { value: String(DEMO.openedYear), label: "Welcoming guests since" },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        photo={photos.authPanel}
        eyebrow="About Nafiis"
        title="Precious, by name and by nature"
        lead={`${brand.name} is ${brand.meaning}. It is how we want every guest to feel.`}
      />

      <section className="py-16 md:py-28">
        <Container className="grid gap-8 lg:grid-cols-[2fr_3fr] lg:gap-20">
          <Reveal>
            <SectionHeading eyebrow="Our story" title="A calm place on the Mogadishu coast" />
          </Reveal>
          <Reveal delay={1} className="flex flex-col gap-5 text-lg leading-8 text-foreground/85">
            <p className="font-display text-2xl leading-9 text-foreground">
              Nafiis opened in {DEMO.openedYear} to give visitors to {brand.city} a place that feels like home: sea air, good food and people who look after you.
            </p>
            <p>
              We are in {brand.contact.district}, close to the coast and the business district, and {brand.contact.airportMinutes} minutes from Aden Adde International Airport. Guests come for work, for family and to see the city again.
            </p>
            <p>Whatever brings you here, our job is the same: a clean room, a good meal and a warm welcome, every time.</p>
          </Reveal>
        </Container>
      </section>

      <section className="lattice bg-brand py-14 md:py-20">
        <Container>
          <dl className="grid grid-cols-2 gap-y-10 md:grid-cols-4">
            {NUMBERS.map(({ value, label }, index) => (
              <Reveal key={label} delay={index} className="flex flex-col-reverse items-center gap-2 text-center">
                <dt className="text-sm text-[#dce5ea]">{label}</dt>
                <dd className="font-display text-[44px] leading-none text-white md:text-[56px]">{value}</dd>
              </Reveal>
            ))}
          </dl>
        </Container>
      </section>

      <section className="py-16 md:py-28">
        <Container className="flex flex-col gap-10 md:gap-12">
          <Reveal>
            <SectionHeading eyebrow="What we care about" title="The small things, every day" />
          </Reveal>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {VALUES.map(({ icon: Icon, title, text }, index) => (
              <Reveal as="li" key={title} delay={index} className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-6 transition duration-300 hover:-translate-y-1 hover:shadow-card">
                <span className="flex size-11 items-center justify-center rounded-full bg-brand/8 text-brand">
                  <Icon aria-hidden className="size-5" />
                </span>
                <h3 className="font-display text-[22px] leading-7 font-normal">{title}</h3>
                <p className="text-[15px] leading-[22px] text-muted">{text}</p>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      <section id="gallery" className="scroll-mt-20 border-t border-border bg-surface py-16 md:py-28">
        <Container className="flex flex-col gap-8 md:gap-10">
          <Reveal>
            <SectionHeading eyebrow="Gallery" title="Inside Nafiis, and the city around it" lead="Filter by what you want to see, and open any photo to browse full screen." />
          </Reveal>
          <Reveal delay={1}>
            <Gallery items={GALLERY} filters />
          </Reveal>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
