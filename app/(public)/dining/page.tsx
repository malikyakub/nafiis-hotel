import { ArrowRight, BellRing, LogIn, ReceiptText, Smartphone, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { CtaBand } from "@/components/ui/cta-band";
import { IconBubble } from "@/components/ui/icon-bubble";
import { MenuTabs } from "@/components/ui/menu-tabs";
import { PageHero } from "@/components/ui/page-hero";
import { Photo } from "@/components/ui/photo";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { MENU, RESTAURANT_POINTS } from "@/lib/content";
import { photos } from "@/lib/photos";
import { liveMenu } from "@/lib/live-content";

export const metadata: Metadata = {
  title: "Dining",
  description: "Somali and coastal dishes cooked to order, at your table or in your room.",
};

const STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Smartphone, title: "Order from your phone", text: "Sign in during your stay and pick from the menu, from the table or your room." },
  { icon: BellRing, title: "Straight to the kitchen", text: "Your order goes to the kitchen the moment you send it, and is cooked fresh." },
  { icon: ReceiptText, title: "Added to your bill", text: "Nothing to pay at the table. Every order shows on your bill, itemised." },
];

export default async function DiningPage() {
  const MENU = await liveMenu();
  return (
    <>
      <PageHero
        photo={photos.restaurant}
        eyebrow="Dining"
        title="Cooked to order, served where you are"
        lead="Bariis, grilled fish from the morning catch, fresh juice and shaah. At the table or brought to your room."
      >
        <ButtonLink href="#menu">
          See the menu
          <ArrowRight aria-hidden />
        </ButtonLink>
      </PageHero>

      <section className="py-16 md:py-28">
        <Container className="grid items-center gap-8 lg:grid-cols-[5fr_6fr] lg:gap-[72px]">
          <Reveal className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="The kitchen"
              title="Somali home cooking, by the sea"
              lead="Our cooks make the dishes guests grow up with, and fish bought on the shore that morning. Nothing waits under a lamp: it is cooked when you order."
            />
            <ul className="flex flex-col gap-3">
              {RESTAURANT_POINTS.map(({ icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-[15px] leading-[22px]">
                  <IconBubble icon={icon} />
                  {text}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={1} className="overflow-hidden rounded-[28px]">
            <Photo photo={photos.restaurant} sizes="(min-width: 1024px) 55vw, 100vw" className="h-72 rounded-[28px] md:h-[440px]" />
          </Reveal>
        </Container>
      </section>

      <section id="menu" className="scroll-mt-20 border-y border-border bg-surface py-16 md:py-28">
        <Container className="flex flex-col gap-10">
          <Reveal>
            <SectionHeading eyebrow="Menu" title="What's cooking" lead="A taste of the menu. Dishes change with the market and the catch." />
          </Reveal>
          <Reveal delay={1}>
            <MenuTabs sections={MENU} />
          </Reveal>
        </Container>
      </section>

      <section className="py-16 md:py-28">
        <Container className="flex flex-col gap-10">
          <Reveal>
            <SectionHeading
              eyebrow="Staying with us"
              title="Order in three taps"
              action={
                <ButtonLink href="/login" variant="secondary" className="hidden md:inline-flex">
                  <LogIn aria-hidden />
                  Sign in to order
                </ButtonLink>
              }
            />
          </Reveal>
          <ol className="grid gap-4 md:grid-cols-3 md:gap-6">
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <Reveal as="li" key={title} delay={index} className="relative flex flex-col gap-4 rounded-3xl border border-border bg-surface p-6 transition duration-300 hover:-translate-y-1 hover:shadow-card">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-full bg-brand/8 text-brand">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <span className="font-display text-[40px] leading-none text-border">{index + 1}</span>
                </div>
                <h3 className="font-display text-[22px] leading-7 font-normal">{title}</h3>
                <p className="text-[15px] leading-[22px] text-muted">{text}</p>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      <CtaBand title="Stay, and dinner comes to you." />
    </>
  );
}
