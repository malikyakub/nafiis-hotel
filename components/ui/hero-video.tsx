"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

type HeroVideoProps = { src: string; className?: string };

// Muted, looping background video. Decorative only, so hidden from screen readers.
// Stays paused on the first frame for visitors who ask for reduced motion.
export function HeroVideo({ src, className }: HeroVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    // React does not reliably set `muted` as a property, and browsers only autoplay muted video.
    video.muted = true;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (query.matches) video.pause();
      else video.play().catch(() => {});
    };
    sync();
    // The first play() can fail before enough data has loaded; try again once it can play.
    video.addEventListener("canplay", sync, { once: true });
    query.addEventListener("change", sync);
    return () => {
      video.removeEventListener("canplay", sync);
      query.removeEventListener("change", sync);
    };
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden
      tabIndex={-1}
      className={cn("pointer-events-none size-full object-cover", className)}
    />
  );
}
