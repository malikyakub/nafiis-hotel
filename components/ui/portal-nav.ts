import {
  BedDouble, CalendarDays, CalendarPlus, CreditCard, LayoutDashboard, Link2, Settings, UserPlus, Users,
  UtensilsCrossed, BarChart3, Search, ClipboardList,
} from "lucide-react";
import type { NavItem } from "./sidebar";

export type Portal = "admin" | "receptionist" | "guest";

// Sidebar and breadcrumb source for each portal. Every entry is its own route.
export const PORTALS: Record<Portal, { name: string; home: string; roleLabel: string; items: NavItem[] }> = {
  admin: {
    name: "Administration",
    home: "/admin",
    roleLabel: "Administrator",
    items: [
      { label: "Overview", icon: LayoutDashboard, href: "/admin" },
      { label: "Bookings", icon: CalendarDays, children: [
        { label: "All bookings", href: "/admin/bookings" },
        { label: "Walk-in reservation", href: "/admin/bookings/walk-in" },
        { label: "Availability", href: "/admin/bookings/availability" },
      ] },
      { label: "Payments", icon: CreditCard, children: [
        { label: "Review queue", href: "/admin/payments/queue" },
        { label: "History", href: "/admin/payments/history" },
      ] },
      { label: "Rooms", icon: BedDouble, children: [
        { label: "Rooms", href: "/admin/rooms" },
        { label: "Room types & prices", href: "/admin/rooms/types" },
      ] },
      { label: "Restaurant", icon: UtensilsCrossed, children: [
        { label: "Menu", href: "/admin/restaurant/menu" },
        { label: "Orders", href: "/admin/restaurant/orders" },
      ] },
      { label: "People", icon: Users, children: [
        { label: "Customers", href: "/admin/people/customers" },
        { label: "Receptionists", href: "/admin/people/receptionists" },
      ] },
      { label: "Blockchain", icon: Link2, children: [
        { label: "Ledger", href: "/admin/blockchain/ledger" },
      ] },
      { label: "Reports", icon: BarChart3, href: "/admin/reports" },
      { label: "Settings", icon: Settings, href: "/admin/settings" },
    ],
  },
  receptionist: {
    name: "Reception",
    home: "/reception",
    roleLabel: "Receptionist",
    items: [
      { label: "Overview", icon: LayoutDashboard, href: "/reception" },
      { label: "Bookings", icon: ClipboardList, href: "/reception/bookings" },
      { label: "Walk-in", icon: UserPlus, href: "/reception/walk-in" },
      { label: "Availability", icon: Search, href: "/reception/availability" },
      { label: "Payments", icon: CreditCard, href: "/reception/payments" },
      { label: "Rooms", icon: BedDouble, href: "/reception/rooms" },
    ],
  },
  guest: {
    name: "My account",
    home: "/guest",
    roleLabel: "Guest",
    items: [
      { label: "My bookings", icon: CalendarPlus, href: "/guest" },
      { label: "Payments", icon: CreditCard, href: "/guest/payments" },
    ],
  },
};

export const SIDEBAR_COOKIE = "nafiis-sidebar";
