import { Button, type ButtonVariant } from "./button";

type SubmitButtonProps = {
  pending: boolean;
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: ButtonVariant;
};

export function SubmitButton({ pending, children, pendingLabel, variant }: SubmitButtonProps) {
  return (
    <Button type="submit" variant={variant} disabled={pending} aria-disabled={pending}>
      {pending ? (pendingLabel ?? "Please wait…") : children}
    </Button>
  );
}
