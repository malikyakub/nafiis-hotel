import Link from "next/link";
import { photos } from "@/lib/photos";
import { BrandMark, BrandSymbol } from "./brand-mark";
import { Photo } from "./photo";

// Layout for sign-in and account pages. Mobile: the form alone. lg+: a full-bleed photo panel
// takes two thirds on the left, with the brand and headline on top; the form sits in the last third.
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(420px,1fr)]">
      <aside className="relative isolate hidden overflow-hidden bg-foreground text-white lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 -z-20">
          <Photo photo={photos.authPanel} sizes="67vw" eager className="h-full rounded-none!" />
        </div>
        {/* Ink wash so the white text reads over any part of the photo: darker top and bottom. */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-foreground/55 via-foreground/10 to-foreground/80" />
        <div aria-hidden className="lattice absolute inset-0 -z-10 opacity-60" />
        <BrandSymbol size={64} tone="bare" className="-ml-2" />
        <div className="flex flex-col gap-3">
          <p className="font-display text-[44px] leading-[50px]">
            A precious stay, <em className="text-[#f2b8a5]">by the ocean</em>.
          </p>
          <p className="max-w-md text-base leading-6 text-white/85">
            Book a room, order from the restaurant and manage your stay in one place.
          </p>
        </div>
      </aside>
      <main className="flex flex-1 flex-col items-center px-4 pt-12 pb-10 lg:justify-center lg:px-10 lg:py-12">
        <div className="flex w-full max-w-96 flex-col gap-7">
          <Link
            href="/"
            aria-label="Nafiis Hotel, home"
            className="self-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          >
            <BrandMark size="md" />
          </Link>
          <div className="flex w-full flex-col gap-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
