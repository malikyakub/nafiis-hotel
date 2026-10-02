import Image from "next/image";
import type { SitePhoto } from "@/lib/photos";
import { cn } from "@/lib/cn";

type PhotoProps = {
  photo: SitePhoto;
  // Rendered width hint for the image optimiser, e.g. "(min-width: 1024px) 50vw, 100vw".
  sizes: string;
  // Load straight away, for photos visible on first paint.
  eager?: boolean;
  // Size and round it from the parent (height, aspect-[4/3], rounded-3xl).
  className?: string;
};

// A cropped photo that fills its box. Use PhotoSlot instead while a photo is still to come.
export function Photo({ photo, sizes, eager, className }: PhotoProps) {
  return (
    <figure className={cn("relative m-0 overflow-hidden rounded-3xl bg-sand-dark", className)}>
      <Image src={photo.src} alt={photo.alt} fill sizes={sizes} loading={eager ? "eager" : "lazy"} className="object-cover" />
    </figure>
  );
}
