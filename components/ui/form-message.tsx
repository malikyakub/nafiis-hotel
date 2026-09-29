type FormMessageProps = { error?: string; success?: string };

export function FormMessage({ error, success }: FormMessageProps) {
  if (error) {
    return (
      <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
        {success}
      </p>
    );
  }
  return null;
}
