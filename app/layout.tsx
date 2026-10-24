import type { Metadata, Viewport } from "next";
import { Geist, Gloock } from "next/font/google";
import { Suspense } from "react";
import { AppModeNavigation } from "@/components/ui/app-mode-navigation";
import { AlertProvider } from "@/components/ui/alert-provider";
import { brand } from "@/lib/brand";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const gloock = Gloock({
  variable: "--font-gloock",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${brand.name} · ${brand.tagline}`,
    template: `%s · ${brand.name}`,
  },
  description: `${brand.name}, a hotel in ${brand.city}. Sea-facing rooms, a restaurant that cooks to order, and easy online booking.`,
};

export const viewport: Viewport = {
  themeColor: brand.colors.brand,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${gloock.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <AlertProvider>{children}</AlertProvider>
        <Suspense fallback={null}><AppModeNavigation /></Suspense>
      </body>
    </html>
  );
}
