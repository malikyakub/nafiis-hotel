// Browser helpers for the portal pages. They call the existing API routes only.

export type Relation<T> = T | T[] | null;

/** Supabase returns a to-one relation as an object or a one-item array. */
export const one = <T,>(value: Relation<T> | undefined): T | undefined =>
  Array.isArray(value) ? value[0] : value ?? undefined;

export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Unable to complete this request.");
  return body as T;
}

export const jsonRequest = (method: "POST" | "PATCH", body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const errorMessage = (error: unknown, fallback = "Please try again.") =>
  error instanceof Error ? error.message : fallback;
