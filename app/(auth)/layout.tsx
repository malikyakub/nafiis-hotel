import Link from "next/link";
import { BrandMark } from "@/components/ui/brand-mark";
import { Card } from "@/components/ui/card";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8">
        <BrandMark />
      </Link>
      <Card className="w-full max-w-sm">{children}</Card>
    </main>
  );
}
