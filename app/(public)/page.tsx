import { brand } from "@/lib/brand";

// Placeholder home. The real public pages come in TASK-11 (S2).
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
        {brand.tagline}
      </p>
      <h1 className="text-5xl font-semibold tracking-tight text-brand sm:text-6xl">
        {brand.name}
      </h1>
      <p className="max-w-md text-muted">
        {brand.meaning}. Hotel management system under construction.
      </p>
    </main>
  );
}
