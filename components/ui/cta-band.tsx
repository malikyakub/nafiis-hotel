import { ArrowRight, Phone } from "lucide-react";
import { liveContact } from "@/lib/live-content";
import { ButtonLink } from "./button";
import { Container } from "./container";
import { Reveal } from "./reveal";

type CtaBandProps = { title?: string; text?: string };

// Closing call to action for the public pages: book, or call reception.
export async function CtaBand({
  title = "Ready when you are.",
  text = "Book in a few minutes, no account needed. Or call reception and we will arrange it for you.",
}: CtaBandProps) {
  const contact = await liveContact();
  return (
    <section className="py-16 md:py-24">
      <Container>
        <Reveal className="lattice relative overflow-hidden rounded-[32px] bg-brand px-6 py-12 text-center md:px-12 md:py-16">
          <div className="mx-auto flex max-w-[640px] flex-col items-center gap-4">
            <h2 className="font-display text-[32px] leading-[38px] font-normal text-white text-balance md:text-[44px] md:leading-[50px]">{title}</h2>
            <p className="text-base leading-[26px] text-[#dce5ea] text-pretty md:text-lg md:leading-7">{text}</p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <ButtonLink href="/#book" variant="solid-light">
                Book a room
                <ArrowRight aria-hidden />
              </ButtonLink>
              <ButtonLink href={`tel:${contact.phoneHref}`} variant="ghost-light">
                <Phone aria-hidden />
                {contact.phone}
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
