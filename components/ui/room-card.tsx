import { ArrowRight, BedDouble } from "lucide-react";
import Link from "next/link";
import { usd, type Room } from "@/lib/content";
import { ButtonLink } from "./button";
import { Card } from "./card";
import { Photo } from "./photo";

// Room type card: the photo and name open the room page, the button books.
export function RoomCard({ room }: { room: Room }) {
  return (
    <Card className="group flex h-full flex-col gap-4 p-3 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgb(20_32_43/0.45)]">
      <Link href={`/rooms/${room.slug}`} tabIndex={-1} aria-hidden className="overflow-hidden rounded-[18px]">
        <Photo
          photo={room.photo}
          sizes="(min-width: 768px) 33vw, 100vw"
          className="aspect-[4/3] rounded-[18px] transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.04]"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 px-1">
        <h3 className="font-display text-[22px] leading-7 font-normal">
          <Link href={`/rooms/${room.slug}`} className="rounded-sm transition hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            {room.name}
          </Link>
        </h3>
        <p className="flex items-center gap-1.5 text-[13px] leading-[18px] text-muted">
          <BedDouble aria-hidden className="size-4 shrink-0" />
          {room.specs}
        </p>
        <p className="mt-1 text-[15px] leading-[22px] text-muted">{room.summary}</p>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border px-1 pt-3">
        <p className="text-sm text-muted">
          From <strong className="text-[17px] font-semibold text-foreground">{usd(room.price)}</strong> / night
        </p>
        <ButtonLink href={`/rooms/${room.slug}`} variant="secondary" size="sm" aria-label={`View the ${room.name}`}>
          View
          <ArrowRight aria-hidden />
        </ButtonLink>
      </div>
    </Card>
  );
}
