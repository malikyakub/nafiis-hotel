import { BrandMark } from "@/components/ui/brand-mark";
import { brand } from "@/lib/brand";

// Placeholder home. The real public pages come in TASK-11 (S2).
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <h1>
        <BrandMark size="lg" />
      </h1>
      <p className="max-w-md text-muted">
        {brand.meaning}. Hotel management system under construction.
      </p>
    </main>
  );
}
