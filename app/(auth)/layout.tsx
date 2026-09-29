import Link from "next/link";
import { brand } from "@/lib/brand";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 text-center">
        <span className="block text-3xl font-semibold tracking-tight text-brand">{brand.name}</span>
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
          {brand.tagline}
        </span>
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
        {children}
      </div>
    </main>
  );
}
