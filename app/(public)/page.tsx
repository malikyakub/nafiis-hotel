import {
  ArrowRight,
  BedDouble,
  ConciergeBell,
  ExternalLink,
  LogIn,
  Mail,
  MapPin,
  Phone,
  Plane,
  ReceiptText,
  ShieldCheck,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BrandSymbol } from "@/components/ui/brand-mark";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DetailList } from "@/components/ui/detail-list";
import { PhotoSlot } from "@/components/ui/photo-slot";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/cn";

// Marketing copy is placeholder until the hotel signs it off; [BRACKETS] are facts still to fill in.
// Booking links go to sign-in until the guest booking flow exists.

const ROOMS = [
  {
    name: "Ocean room",
    specs: "King bed · Sea view · [SIZE] m²",
    text: "Wide windows onto the water, with a desk for working stays.",
  },
  {
    name: "Garden room",
    specs: "Twin or king · Courtyard · [SIZE] m²",
    text: "Quiet side of the hotel, shaded by the courtyard trees.",
  },
  {
    name: "Family suite",
    specs: "King + twin · Lounge · [SIZE] m²",
    text: "Two rooms and a lounge for families staying longer.",
  },
];

const RESTAURANT: { icon: LucideIcon; text: string }[] = [
  { icon: UtensilsCrossed, text: "Somali and coastal dishes, cooked to order" },
  { icon: ConciergeBell, text: "Room service for staying guests" },
  { icon: ReceiptText, text: "Added to your bill, itemised" },
];

const PROOF_STEPS = [
  { title: "Pay for your stay or meal", text: "At reception or online, the way you already pay." },
  {
    title: "We record a Proof of Payment",
    text: "A fingerprint of the payment is written to a public blockchain. Your personal details are not.",
  },
  {
    title: "Anyone can verify it",
    text: "Share the reference with your employer or agent. They check it themselves.",
  },
];

const LOCATION: { icon: LucideIcon; text: React.ReactNode }[] = [
  {
    icon: MapPin,
    text: (
      <>
        [STREET ADDRESS], [DISTRICT]
        <br />
        Mogadishu, Somalia
      </>
    ),
  },
  { icon: Phone, text: "[+252 PHONE NUMBER]" },
  { icon: Mail, text: "[RESERVATIONS EMAIL]" },
  { icon: Plane, text: "[XX] minutes from Aden Adde International Airport" },
];

function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto max-w-[1200px] px-4 md:px-10", className)}>{children}</div>;
}

function IconBubble({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-brand">
      <Icon aria-hidden className="size-[18px]" />
    </span>
  );
}

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-10 pb-16 md:pt-[72px] md:pb-28">
        <Container className="grid items-center gap-8 lg:grid-cols-[5fr_6fr] lg:gap-16">
          <div className="flex flex-col gap-5 md:gap-6">
            <p className="text-xs leading-4 font-semibold uppercase tracking-[0.16em] text-accent">
              Welcome to Nafiis
            </p>
            <h1 className="font-display text-[40px] leading-[44px] font-normal tracking-[-0.015em] text-balance md:text-[64px] md:leading-[68px]">
              A precious stay on the Mogadishu coast.
            </h1>
            <p className="max-w-[560px] text-base leading-[26px] text-muted text-pretty md:text-lg md:leading-7">
              Sea-facing rooms, a kitchen that cooks to order, and a receipt you can prove. Book in a few
              minutes and pay the way you already do.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <ButtonLink href="/login">
                Book a room
                <ArrowRight aria-hidden />
              </ButtonLink>
              <ButtonLink href="/login" variant="secondary">
                <LogIn aria-hidden />
                Sign in
              </ButtonLink>
            </div>
            <p className="flex items-center gap-2 text-sm text-muted">
              <ShieldCheck aria-hidden className="size-[18px] shrink-0 text-success" />
              Every payment comes with a verifiable Proof of Payment.
            </p>
          </div>
          <PhotoSlot
            label="hero"
            direction="Morning light across a whitewashed terrace facing the Indian Ocean; a carved wooden door frame at the edge; linen, brass, coral stone. No faces to camera."
            className="h-80 rounded-[28px] md:h-[560px] md:rounded-[36px]"
          />
        </Container>
      </section>

      {/* Rooms */}
      <section id="rooms" className="scroll-mt-20 pb-16 md:pb-28">
        <Container>
          <SectionHeading
            eyebrow="Rooms"
            title="Rest within sound of the ocean"
            lead="Three room types, each with fast Wi-Fi, air conditioning and daily housekeeping."
            action={
              <ButtonLink href="/login" className="hidden md:inline-flex">
                Book a room
                <ArrowRight aria-hidden />
              </ButtonLink>
            }
          />
          <div className="mt-7 grid gap-4 md:mt-12 md:grid-cols-3 md:gap-6">
            {ROOMS.map((room) => (
              <Card key={room.name} className="flex flex-col gap-4 p-3">
                <PhotoSlot
                  label="room"
                  direction="Room interior, daylight, made bed, window to the sea or courtyard; neutral linen with one woven accent."
                  className="aspect-[4/3] rounded-[18px]"
                />
                <div className="flex flex-1 flex-col gap-1.5 px-1">
                  <h3 className="font-display text-[22px] leading-7 font-normal">{room.name}</h3>
                  <p className="flex items-center gap-1.5 text-[13px] leading-[18px] text-muted">
                    <BedDouble aria-hidden className="size-4 shrink-0" />
                    {room.specs}
                  </p>
                  <p className="mt-1 text-[15px] leading-[22px] text-muted">{room.text}</p>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border px-1 pt-3">
                  <p className="text-sm text-muted">
                    From <strong className="text-[17px] font-semibold text-foreground">[PRICE]</strong> / night
                  </p>
                  <ButtonLink href="/login" variant="secondary" size="sm" aria-label={`Book the ${room.name}`}>
                    Book
                    <ArrowRight aria-hidden />
                  </ButtonLink>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Restaurant */}
      <section id="restaurant" className="scroll-mt-20 border-y border-border bg-surface py-16 md:py-28">
        <Container className="grid items-center gap-8 lg:grid-cols-[6fr_5fr] lg:gap-[72px]">
          <PhotoSlot
            label="restaurant"
            direction="Overhead on a woven tray: bariis iskukaris, grilled kingfish, banana, lime and shaah in glass cups. Warm daylight, hands at the frame edge."
            className="h-72 rounded-[28px] md:h-[480px]"
          />
          <div className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="Restaurant"
              title="Order to your table or your room"
              lead="Bariis, grilled fish from the morning catch, fresh juice and shaah. Order from your phone and it goes straight to the kitchen."
            />
            <ul className="flex flex-col gap-3">
              {RESTAURANT.map(({ icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-[15px] leading-[22px]">
                  <IconBubble icon={icon} />
                  {text}
                </li>
              ))}
            </ul>
            <div>
              <ButtonLink href="/login" variant="secondary">
                <LogIn aria-hidden />
                Sign in to order
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      {/* Proof of Payment */}
      <section id="proof" className="lattice scroll-mt-20 bg-brand py-16 md:py-28">
        <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col gap-8">
            <SectionHeading
              tone="on-brand"
              eyebrow="Proof of Payment"
              title="A receipt anyone can check."
              lead="Paper receipts get lost and screenshots can be edited. A Nafiis Proof of Payment can be verified by anyone, any time, without calling the hotel."
            />
            <ol className="flex flex-col gap-5">
              {PROOF_STEPS.map((step, index) => (
                <li key={step.title} className="flex items-start gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/40 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[15px] leading-[22px] font-semibold text-white">{step.title}</p>
                    <p className="text-sm leading-[21px] text-[#dce5ea]">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <Card className="flex flex-col gap-4 p-6 shadow-[0_24px_60px_-24px_rgb(0_0_0/0.45)] md:p-7">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <BrandSymbol size={32} />
                <p className="font-display text-xl leading-[26px]">Proof of Payment</p>
              </div>
              <Badge status="success">Verified</Badge>
            </div>
            <DetailList
              items={[
                { label: "Reference", value: "[POP-REFERENCE]", mono: true },
                { label: "Guest", value: "Amina Hassan" },
                { label: "Stay", value: "3 nights · Ocean room" },
                { label: "Amount", value: "[AMOUNT]" },
                { label: "Recorded", value: "[DATE · TIME]" },
                { label: "Transaction", value: "[0x8f3a…c21e]", mono: true },
              ]}
            />
            <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-sm">
              <span className="inline-flex items-center gap-1 font-medium text-brand">
                Verify on the blockchain
                <ExternalLink aria-hidden className="size-3.5" />
              </span>
              <Badge status="neutral">Sample</Badge>
            </div>
          </Card>
        </Container>
      </section>

      {/* Location */}
      <section id="location" className="scroll-mt-20 py-16 md:py-28">
        <Container className="grid items-center gap-8 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="Location"
              title="In the heart of Mogadishu"
              lead="Close to the coast and the city’s business district, with airport pickup on request."
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
              <ButtonLink href="/login">
                Book a room
                <ArrowRight aria-hidden />
              </ButtonLink>
            </div>
          </div>
          <PhotoSlot
            label="map"
            direction="OpenStreetMap embed (free; ODbL attribution required) or a flat illustrated map in brand colours with one coral pin."
            className="h-72 rounded-[28px] md:h-[440px]"
          />
        </Container>
      </section>
    </>
  );
}
