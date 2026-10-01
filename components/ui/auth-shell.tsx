import Link from "next/link";
import { BrandMark, BrandSymbol } from "./brand-mark";
import { Card } from "./card";
import { PhotoSlot } from "./photo-slot";

// Layout for sign-in and account pages. Mobile: one centred card. lg+: brand panel on the left.
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 lg:grid lg:grid-cols-[560px_minmax(0,1fr)]">
      <aside className="lattice hidden flex-col gap-8 bg-brand p-10 text-white lg:flex">
        <BrandSymbol size={40} />
        <PhotoSlot
          tone="on-brand"
          label="auth panel"
          direction="Golden-hour view from a whitewashed terrace over the Indian Ocean; carved wooden door frame at the left edge; calm, unstaged, no faces to camera."
          className="min-h-80 flex-1 rounded-[28px]"
        />
        <div className="flex flex-col gap-2.5">
          <p className="font-display text-[34px] leading-10">
            A precious stay, <em className="text-[#f2b8a5]">by the ocean</em>.
          </p>
          <p className="text-[15px] leading-[22px] text-[#dce5ea]">
            Book a room, order from the restaurant and keep a Proof of Payment anyone can verify.
          </p>
        </div>
      </aside>
      <main className="lattice-sand flex flex-1 flex-col items-center px-4 pt-12 pb-10 lg:justify-center lg:px-8 lg:py-12">
        <div className="flex w-full max-w-96 flex-col items-center gap-7">
          <Link
            href="/"
            aria-label="Nafiis Hotel, home"
            className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          >
            <BrandMark size="md" />
          </Link>
          <Card className="flex w-full flex-col gap-6">{children}</Card>
        </div>
      </main>
    </div>
  );
}
