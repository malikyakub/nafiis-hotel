import type { SitePhoto } from "@/lib/photos";
import { Container } from "./container";
import { Photo } from "./photo";

type PageHeroProps = {
  photo: SitePhoto;
  eyebrow: string;
  title: string;
  lead?: string;
  // Buttons or facts under the lead.
  children?: React.ReactNode;
};

// Full-bleed photo hero for the inner public pages. The header sits on it transparent, as on home.
export function PageHero({ photo, eyebrow, title, lead, children }: PageHeroProps) {
  return (
    <section className="relative isolate flex min-h-[440px] items-end overflow-hidden bg-foreground md:min-h-[560px]">
      <div className="absolute inset-0 -z-20 animate-hero-zoom">
        <Photo photo={photo} sizes="100vw" eager className="h-full rounded-none!" />
      </div>
      <div aria-hidden className="absolute inset-0 -z-10 bg-foreground/45" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-foreground/60 via-transparent to-foreground/75" />
      <Container className="flex w-full flex-col gap-4 pt-32 pb-12 md:gap-5 md:pb-16">
        <p className="animate-hero-in text-xs leading-4 font-semibold uppercase tracking-[0.16em] text-[color-mix(in_oklab,var(--accent)_35%,white)]">
          {eyebrow}
        </p>
        <h1 className="max-w-[760px] animate-hero-in font-display text-[40px] leading-[44px] font-normal tracking-[-0.015em] text-white text-balance [animation-delay:80ms] md:text-[60px] md:leading-[64px]">
          {title}
        </h1>
        {lead && (
          <p className="max-w-[560px] animate-hero-in text-base leading-[26px] text-white/85 text-pretty [animation-delay:160ms] md:text-lg md:leading-7">
            {lead}
          </p>
        )}
        {children && <div className="animate-hero-in pt-1 [animation-delay:240ms]">{children}</div>}
      </Container>
    </section>
  );
}
