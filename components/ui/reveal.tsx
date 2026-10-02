"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type RevealProps = {
  children: React.ReactNode;
  // Stagger siblings: each step adds 70ms.
  delay?: number;
  as?: "div" | "li";
  className?: string;
};

// Fades and lifts its content in the first time it scrolls into view (see .reveal in globals.css).
export function Reveal({ children, delay = 0, as: Tag = "div", className }: RevealProps) {
  const ref = useRef<HTMLDivElement & HTMLLIElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} data-shown={shown || undefined} style={{ transitionDelay: `${delay * 70}ms` }} className={cn("reveal", className)}>
      {children}
    </Tag>
  );
}
