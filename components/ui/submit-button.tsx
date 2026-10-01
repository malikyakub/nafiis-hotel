import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, type ButtonVariant } from "./button";

type SubmitButtonProps = {
  pending: boolean;
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: ButtonVariant;
  className?: string;
};

// Full width by default, as forms use it. Pending shows a spinner and keeps the button readable.
export function SubmitButton({ pending, children, pendingLabel, variant, className }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      variant={variant}
      disabled={pending}
      aria-busy={pending}
      className={cn("w-full", pending && "cursor-progress disabled:opacity-80", className)}
    >
      {pending && <LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" />}
      {pending ? (pendingLabel ?? "Please wait…") : children}
    </Button>
  );
}
