import { ArrowRight, CalendarDays, Lock, LogIn, Mail, MailCheck, Phone, Search, User } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { BrandMark, BrandSymbol } from "@/components/ui/brand-mark";
import { Button, ButtonLink, type ButtonVariant } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DetailList } from "@/components/ui/detail-list";
import { Field } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { PhotoSlot } from "@/components/ui/photo-slot";
import { ResultMessage } from "@/components/ui/result-message";
import { SectionHeading } from "@/components/ui/section-heading";
import { STATUSES } from "@/components/ui/status";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextLink } from "@/components/ui/text-link";
import { AlertDemo } from "./alert-demo";
import { PickerDemo } from "./picker-demo";

export const metadata: Metadata = { title: "Components", robots: { index: false } };

const BUTTON_VARIANTS: ButtonVariant[] = ["primary", "secondary", "ghost", "success", "warning", "danger"];

const DOMAIN_STATUSES = {
  Room: ["available", "reserved", "occupied", "cleaning", "maintenance"],
  Booking: ["pending_payment", "payment_submitted", "under_review", "confirmed", "checked_in", "checked_out", "cancelled", "completed"],
  Payment: ["submitted", "approved", "rejected", "anchored", "failed"],
  Order: ["pending", "confirmed", "preparing", "ready", "served", "completed", "cancelled"],
};

// Swatches read the live CSS variables, so this stays in sync with app/globals.css.
const COLOURS = [
  "background",
  "surface",
  "foreground",
  "muted",
  "border",
  "border-strong",
  "brand",
  "brand-foreground",
  "accent",
  "sand-dark",
];

const TYPE_SCALE = [
  { name: "Display", spec: "Gloock 64/68 · hero (40/44 mobile)", className: "font-display text-[40px] leading-[44px] md:text-[64px] md:leading-[68px]", sample: "A precious stay" },
  { name: "H1", spec: "Gloock 40/46 · page titles (28/34 mobile)", className: "font-display text-[28px] leading-[34px] md:text-[40px] md:leading-[46px]", sample: "Rooms by the ocean" },
  { name: "H2", spec: "Gloock 28/34 · sections, auth card titles", className: "font-display text-[28px] leading-[34px]", sample: "Create a guest account" },
  { name: "H3", spec: "Gloock 22/28 · card titles", className: "font-display text-[22px] leading-7", sample: "Ocean room" },
  { name: "Body large", spec: "Geist 18/28 · lead paragraphs", className: "text-lg leading-7", sample: "Book rooms, order meals and keep track of your stay." },
  { name: "Body", spec: "Geist 15/24 · default UI text", className: "text-[15px] leading-6", sample: "Guests and staff sign in here." },
  { name: "Small", spec: "Geist 14/20 · secondary text, alerts", className: "text-sm leading-5", sample: "Links work once and expire after an hour." },
  { name: "Label", spec: "Geist 500 13/18 · field labels", className: "text-[13px] leading-[18px] font-medium", sample: "Email" },
  { name: "Eyebrow", spec: "Geist 600 12/16 · +0.16em, uppercase", className: "text-xs leading-4 font-semibold uppercase tracking-[0.16em] text-accent", sample: "Your stay" },
];

const SECTIONS = [
  { id: "colour", title: "Colour", file: "app/globals.css" },
  { id: "type", title: "Typography", file: "app/layout.tsx (fonts)" },
  { id: "brand", title: "Brand mark", file: "components/ui/brand-mark.tsx" },
  { id: "buttons", title: "Buttons", file: "components/ui/button.tsx, submit-button.tsx" },
  { id: "inputs", title: "Inputs", file: "components/ui/field.tsx" },
  { id: "pickers", title: "Pickers", file: "components/ui/date-time-field.tsx, listbox-field.tsx" },
  { id: "badges", title: "Badges", file: "components/ui/badge.tsx" },
  { id: "alerts", title: "Alerts", file: "components/ui/alert.tsx, alert-provider.tsx" },
  { id: "layout", title: "Card · Page header · Text link", file: "card.tsx, page-header.tsx, text-link.tsx" },
  { id: "content", title: "Content blocks", file: "section-heading.tsx, detail-list.tsx, photo-slot.tsx, result-message.tsx" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function Section({ id, children }: { id: SectionId; children: React.ReactNode }) {
  const { title, file } = SECTIONS.find((section) => section.id === id)!;
  return (
    <section id={id} className="scroll-mt-6">
      <Card className="flex flex-col gap-6 md:p-8">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-[28px] leading-[34px]">{title}</h2>
          <p className="font-mono text-xs text-muted">{file}</p>
        </div>
        {children}
      </Card>
    </section>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] leading-[18px] text-muted">{children}</p>;
}

// Every shared UI component in one place, for review and visual checks.
export default function ComponentsPage() {
  return (
    <div className="lattice-sand flex-1">
      <div className="mx-auto grid max-w-page gap-8 px-4 py-10 md:px-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:py-14">
        <aside className="hidden lg:block">
          <nav aria-label="Sections" className="sticky top-14 flex flex-col gap-1">
            <Link href="/" className="mb-4 w-fit rounded-xl">
              <BrandMark size="sm" />
            </Link>
            <p className="mb-2 text-xs leading-4 font-semibold uppercase tracking-[0.16em] text-muted">
              Internal · /components
            </p>
            {SECTIONS.map(({ id, title }) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded-full px-3 py-1.5 text-sm text-foreground transition hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {title}
              </a>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-col gap-8">
          <PageHeader
            title="Components"
            subtitle="Every shared UI component. Build pages from these only."
            actions={
              <ButtonLink href="/" variant="secondary" size="sm">
                Back to site
              </ButtonLink>
            }
          />

          <Section id="colour">
            <Caption>Light mode only. Raw values live in app/globals.css; components use token names.</Caption>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {COLOURS.map((name) => (
                <div key={name} className="flex flex-col gap-2">
                  <span
                    className="h-16 rounded-2xl border border-border"
                    style={{ background: `var(--${name})` }}
                  />
                  <span className="font-mono text-xs">--{name}</span>
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
              {STATUSES.map((status) => (
                <div key={status} className="flex flex-col gap-2">
                  <div className="flex h-16 overflow-hidden rounded-2xl border border-border">
                    <span className="flex-1" style={{ background: `var(--${status})` }} />
                    <span className="flex-1" style={{ background: `var(--${status}-soft)` }} />
                  </div>
                  <span className="font-mono text-xs">
                    --{status} / -soft
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section id="type">
            <Caption>Gloock (display, one weight) over Geist (UI, 400/500/600).</Caption>
            <dl className="flex flex-col">
              {TYPE_SCALE.map(({ name, spec, className, sample }) => (
                <div
                  key={name}
                  className="grid gap-2 border-t border-border py-4 md:grid-cols-[200px_minmax(0,1fr)] md:items-baseline"
                >
                  <dt className="flex flex-col">
                    <span className="text-sm font-semibold">{name}</span>
                    <span className="text-xs text-muted">{spec}</span>
                  </dt>
                  <dd className={className}>{sample}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="brand">
            <Caption>Always links home. The coral lozenge is the only colour accent.</Caption>
            <div className="flex flex-wrap items-end gap-10">
              <BrandMark size="lg" />
              <BrandMark size="md" />
              <BrandMark size="sm" />
            </div>
            <div className="flex flex-wrap items-center gap-8">
              <div className="lattice rounded-3xl bg-brand p-8">
                <BrandMark size="md" tone="reversed" />
              </div>
              <div className="flex items-center gap-4">
                <BrandSymbol size={40} />
                <BrandSymbol size={32} />
                <BrandSymbol size={16} />
              </div>
            </div>
          </Section>

          <Section id="buttons">
            <Caption>Pill radius, 500 weight. md is 44px tall, sm 36px. Hover: the fill sweeps in from the left and leaves to the right.</Caption>
            <div className="flex flex-wrap gap-2">
              {BUTTON_VARIANTS.map((variant) => (
                <Button key={variant} variant={variant} className="capitalize">
                  {variant}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {BUTTON_VARIANTS.map((variant) => (
                <Button key={variant} variant={variant} size="sm" className="capitalize">
                  {variant}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button disabled>Disabled</Button>
              <ButtonLink href="/components">
                Book a room
                <ArrowRight aria-hidden />
              </ButtonLink>
              <ButtonLink href="/components" variant="secondary">
                <LogIn aria-hidden />
                Sign in
              </ButtonLink>
              <Button variant="secondary" aria-label="Search" className="w-11 px-0">
                <Search aria-hidden />
              </Button>
            </div>
            <div className="lattice flex flex-wrap items-center gap-2 rounded-3xl bg-brand p-6">
              <Button variant="solid-light">Solid light</Button>
              <Button variant="outline-light">Outline light</Button>
              <Button variant="ghost-light">Ghost light</Button>
              <Button variant="outline-light" size="sm">Outline light</Button>
            </div>
            <div className="grid max-w-md gap-2 sm:grid-cols-2">
              <SubmitButton pending={false}>Sign in</SubmitButton>
              <SubmitButton pending pendingLabel="Signing in…">
                Sign in
              </SubmitButton>
            </div>
          </Section>

          <Section id="inputs">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" name="demo_name" icon={User} placeholder="Amina Hassan" />
              <Field label="Email" name="demo_email" type="email" icon={Mail} placeholder="you@example.com" />
              <Field label="Phone" name="demo_phone" type="tel" icon={Phone} placeholder="+252 61 234 5678" hint="Optional. Used by reception to contact you." />
              <Field label="Password" name="demo_password" type="password" icon={Lock} hint="At least 8 characters." />
              <Field label="Email (error)" name="demo_error" type="email" icon={Mail} defaultValue="amina@" error="Enter a valid email address." />
              <Field label="Check-in" name="demo_date" type="date" icon={CalendarDays} />
              <Field label="Search (disabled)" name="demo_search" icon={Search} placeholder="Wallet code" disabled />
            </div>
          </Section>

          <Section id="pickers">
            <Caption>No visible label: the label is the placeholder and the accessible name. Date, then time, in one popover.</Caption>
            <PickerDemo />
          </Section>

          <Section id="badges">
            <Caption>Soft fill, status text and an icon, so status never relies on colour alone.</Caption>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((status) => (
                <Badge key={status} status={status} className="capitalize">
                  {status}
                </Badge>
              ))}
            </div>
            <dl className="grid gap-3">
              {Object.entries(DOMAIN_STATUSES).map(([group, values]) => (
                <div key={group} className="flex flex-wrap items-center gap-2">
                  <dt className="w-20 text-sm text-muted">{group}</dt>
                  {values.map((value) => (
                    <dd key={value}>
                      <StatusBadge value={value} />
                    </dd>
                  ))}
                </div>
              ))}
            </dl>
          </Section>

          <Section id="alerts">
            <Caption>Top-right alerts. Each closes after 6 seconds or when dismissed.</Caption>
            <AlertDemo />
            <Caption>Inline, for messages that must stay on the page.</Caption>
            <div className="grid gap-2 sm:grid-cols-2">
              {STATUSES.map((status) => (
                <Alert key={status} status={status} title={`${status[0].toUpperCase()}${status.slice(1)} alert`}>
                  A short message explaining what happened.
                </Alert>
              ))}
            </div>
          </Section>

          <Section id="layout">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <p className="text-sm text-muted">Bookings today</p>
                <p className="mt-1 font-display text-[40px] leading-[46px]">12</p>
              </Card>
              <Card>
                <p className="text-sm text-muted">Payments awaiting review</p>
                <p className="mt-1 font-display text-[40px] leading-[46px]">3</p>
              </Card>
            </div>
            <Card>
              <PageHeader
                title="Rooms"
                subtitle="Manage rooms and room types."
                actions={
                  <>
                    <Button variant="secondary" size="sm">Export</Button>
                    <Button size="sm">Add room</Button>
                  </>
                }
              />
            </Card>
            <p className="text-sm text-muted">
              Already have an account? <TextLink href="/components">Sign in</TextLink> ·{" "}
              <TextLink href="/components" external>
                View your booking
              </TextLink>
            </p>
          </Section>

          <Section id="content">
            <SectionHeading
              eyebrow="Rooms"
              title="Rest within sound of the ocean"
              lead="Section heading: eyebrow, title, lead and an optional action."
              action={<Button size="sm">Book a room</Button>}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <DetailList
                  items={[
                    { label: "Reference", value: "NFS-0001", mono: true },
                    { label: "Guest", value: "Amina Hassan" },
                    { label: "Amount", value: "$120.00" },
                  ]}
                />
              </Card>
              <PhotoSlot
                label="example"
                direction="Daylight, unstaged, coastal materials: coral stone, linen, carved wood, brass, sea."
                className="min-h-48"
              />
            </div>
            <Card className="mx-auto w-full max-w-96">
              <ResultMessage
                icon={MailCheck}
                title="Check your email"
                actions={<Button variant="secondary" className="w-full">Back to sign in</Button>}
                note="Result message: replaces a form once it is done."
              >
                A short line about what happens next.
              </ResultMessage>
            </Card>
          </Section>
        </div>
      </div>
    </div>
  );
}
