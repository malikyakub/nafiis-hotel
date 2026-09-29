type SubmitButtonProps = {
  pending: boolean;
  children: React.ReactNode;
  pendingLabel?: string;
};

export function SubmitButton({ pending, children, pendingLabel }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="h-11 rounded-lg bg-brand px-4 font-medium text-brand-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (pendingLabel ?? "Please wait…") : children}
    </button>
  );
}
