import { CalendarDays, Lock, Mail, Phone, Search, User } from "lucide-react";
import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { BrandMark } from "@/components/ui/brand-mark";
import { Button, ButtonLink, type ButtonVariant } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { STATUSES } from "@/components/ui/status";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextLink } from "@/components/ui/text-link";
import { AlertDemo } from "./alert-demo";

export const metadata: Metadata = { title: "Components", robots: { index: false } };

const BUTTON_VARIANTS: ButtonVariant[] = ["primary", "secondary", "ghost", "success", "warning", "danger"];

const DOMAIN_STATUSES = {
  Room: ["available", "reserved", "occupied", "cleaning", "maintenance"],
  Booking: ["pending_payment", "payment_submitted", "under_review", "confirmed", "checked_in", "checked_out", "cancelled", "completed"],
  Payment: ["submitted", "approved", "rejected", "anchored", "failed"],
  Order: ["pending", "confirmed", "preparing", "ready", "served", "completed", "cancelled"],
};

function Section({ title, file, children }: { title: string; file: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="font-mono text-xs text-muted">{file}</p>
      </div>
      {children}
    </section>
  );
}

// Every shared UI component in one place, for review and visual checks.
export default function ComponentsPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-4 py-12">
      <PageHeader
        title="Components"
        subtitle="Every shared UI component. Build pages from these only."
        actions={<ButtonLink href="/" variant="secondary" size="sm">Back to site</ButtonLink>}
      />

      <Section title="Buttons" file="components/ui/button.tsx, submit-button.tsx">
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
          <SubmitButton pending pendingLabel="Saving…">Save</SubmitButton>
          <ButtonLink href="/components">Link as button</ButtonLink>
        </div>
      </Section>

      <Section title="Inputs" file="components/ui/field.tsx">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" name="demo_name" icon={User} placeholder="Amina Hassan" />
          <Field label="Email" name="demo_email" type="email" icon={Mail} placeholder="you@example.com" />
          <Field label="Phone" name="demo_phone" type="tel" icon={Phone} placeholder="+252 61 234 5678" hint="Optional. Used by reception to contact you." />
          <Field label="Password" name="demo_password" type="password" icon={Lock} hint="At least 8 characters." />
          <Field label="Check-in" name="demo_date" type="date" icon={CalendarDays} />
          <Field label="Search (disabled)" name="demo_search" icon={Search} placeholder="Wallet code" disabled />
        </div>
      </Section>

      <Section title="Badges" file="components/ui/badge.tsx">
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

      <Section title="Alerts" file="components/ui/alert.tsx, alert-provider.tsx">
        <p className="text-sm text-muted">Top-right alerts. Each closes after 6 seconds or when dismissed.</p>
        <AlertDemo />
        <p className="text-sm text-muted">Inline, for messages that must stay on the page.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {STATUSES.map((status) => (
            <Alert key={status} status={status} title={`${status[0].toUpperCase()}${status.slice(1)} alert`}>
              A short message explaining what happened.
            </Alert>
          ))}
        </div>
      </Section>

      <Section title="Card" file="components/ui/card.tsx">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <p className="text-sm text-muted">Bookings today</p>
            <p className="mt-1 text-3xl font-semibold">12</p>
          </Card>
          <Card>
            <p className="text-sm text-muted">Payments awaiting review</p>
            <p className="mt-1 text-3xl font-semibold">3</p>
          </Card>
        </div>
      </Section>

      <Section title="Page header" file="components/ui/page-header.tsx">
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
      </Section>

      <Section title="Text link" file="components/ui/text-link.tsx">
        <p className="text-sm text-muted">
          Already have an account? <TextLink href="/login">Sign in</TextLink>
        </p>
      </Section>

      <Section title="Brand mark" file="components/ui/brand-mark.tsx">
        <div className="flex flex-wrap items-end gap-10">
          <BrandMark size="sm" />
          <BrandMark size="md" />
          <BrandMark size="lg" />
        </div>
      </Section>
    </main>
  );
}
