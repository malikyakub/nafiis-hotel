import "server-only";

// Logs only the error's name and message, never the full object, so request
// details, keys or tokens attached to an error can't end up in server logs.
export function logError(context: string, error: unknown) {
  const detail = error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error";
  console.error(`[${context}] ${detail}`);
}
