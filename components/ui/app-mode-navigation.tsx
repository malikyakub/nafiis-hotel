"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { House, BedDouble, CalendarDays, Hotel, UtensilsCrossed, UserRound } from "lucide-react";
import styles from "./app-mode-navigation.module.css";

type Role = "guest" | "admin" | "receptionist" | "restaurant_staff" | null;
const staffHome = { admin: "/admin", receptionist: "/reception", restaurant_staff: "/restaurant" };

function appViewSnapshot() {
  let enabled = new URLSearchParams(window.location.search).get("nafiisApp") === "1";
  try { enabled ||= sessionStorage.getItem("nafiis-app-view") === "1"; } catch { /* Storage is optional. */ }
  return `${enabled ? "1" : "0"}|${window.location.hash}`;
}
function subscribeAppView(notify: () => void) {
  window.addEventListener("hashchange", notify);
  window.addEventListener("popstate", notify);
  return () => {
    window.removeEventListener("hashchange", notify);
    window.removeEventListener("popstate", notify);
  };
}
const serverAppView = () => "0|";

// A presentation flag only. Server-side route/API role checks remain authoritative.
export function AppModeNavigation() {
  const pathname = usePathname();
  const snapshot = useSyncExternalStore(subscribeAppView, appViewSnapshot, serverAppView);
  const enabled = snapshot.startsWith("1|");
  const hash = snapshot.slice(2);
  const [verified, setVerified] = useState<{ pathname: string; role: Role } | null>(null);
  const role = verified?.pathname === pathname ? verified.role : null;

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("nafiisApp") === "1";
    try {
      if (requested) sessionStorage.setItem("nafiis-app-view", "1");
    } catch { /* Query activation still works when storage is unavailable. */ }
  }, [pathname]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    fetch("/api/app/session", { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then(async response => response.ok ? response.json() : null)
      .then(data => {
        if (!controller.signal.aborted) setVerified({ pathname, role: ["guest", "admin", "receptionist", "restaurant_staff"].includes(data?.role) ? data.role : null });
      }).catch(() => { /* Hide staff navigation unless an active server role is verified. */ });
    return () => controller.abort();
  }, [enabled, pathname]);

  if (!enabled) return null;
  const staffPath = role && role !== "guest" ? staffHome[role] : null;
  const active = /^\/(admin|reception|restaurant)(\/|$)/.test(pathname) ? "Hotel"
    : /^\/(login|register|guest|forgot-password|reset-password)(\/|$)/.test(pathname) ? "Account"
    : pathname.startsWith("/rooms") ? "Rooms" : pathname.startsWith("/dining") ? "Dining"
    : pathname === "/" && hash === "#book" ? "Booking" : "Home";
  const items = [
    { label: "Home", href: "/", Icon: House },
    { label: "Rooms", href: "/rooms", Icon: BedDouble },
    { label: "Booking", href: "/#book", Icon: CalendarDays },
    ...(staffPath ? [{ label: "Hotel", href: staffPath, Icon: Hotel }] : []),
    { label: "Dining", href: "/dining", Icon: UtensilsCrossed },
    { label: "Account", href: role === "guest" ? "/guest" : "/login", Icon: UserRound },
  ];
  return <>
    <div aria-hidden="true" className={styles.spacer} />
    <nav aria-label="Nafiis app navigation" className={styles.shelf}>
      <div className={styles.dock}>
        {items.map(({ label, href, Icon }) => <a key={label} href={href} className={styles.item} aria-current={active === label ? "page" : undefined}>
          <span className={styles.icon}><Icon size={22} strokeWidth={active === label ? 2 : 1.7} aria-hidden="true" /></span>
          <span className={styles.label}>{label}</span>
        </a>)}
      </div>
    </nav>
  </>;
}
