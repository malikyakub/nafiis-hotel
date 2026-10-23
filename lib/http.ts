import "server-only";
import { siteOrigin } from "@/lib/site-origin";
import { AccessError } from "@/lib/auth/require-role";
import { logError } from "@/lib/log";

export const json = (data: unknown, status = 200) => Response.json(data, {
  status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
});
export function failure(context: string, error: unknown) {
  if (error instanceof SyntaxError) return json({ error: "Invalid request body." }, 400);
  if (error instanceof AccessError) return json({ error: error.message }, error.status);
  logError(context, error);
  return json({ error: "Unable to complete this request. Please try again." }, 500);
}
export function sameOrigin(request: Request) {
  const denied = () => new AccessError(403, "Request origin is not allowed. Refresh this page and try again.");
  const rawOrigin = request.headers.get("origin");
  if (!rawOrigin || rawOrigin === "null" || request.headers.get("sec-fetch-site") === "cross-site") throw denied();
  try {
    const origin = new URL(rawOrigin);
    if (process.env.NODE_ENV === "production" || process.env.SITE_URL) {
      if (origin.origin !== siteOrigin(request.headers)) throw denied();
      return;
    }
    const internal = new URL(request.url);
    if (!["http:", "https:"].includes(origin.protocol) || origin.origin !== rawOrigin) throw denied();
    // Next.js can construct request.url from its internal listening hostname.
    // Host reflects the browser's target; do not trust arbitrary forwarded hosts.
    const host = request.headers.get("host");
    if (!host || !/^[a-z0-9.\-:\[\]]+$/i.test(host)) throw denied();
    const target = new URL(`${internal.protocol}//${host}`);
    if (origin.origin === target.origin) return;
    // Local development may normalize localhost to its loopback IP. Keep port
    // and protocol exact, and never enable this alias allowance in production.
    const loopback = new Set(["localhost", "127.0.0.1", "[::1]"]);
    if (process.env.NODE_ENV === "development" && loopback.has(origin.hostname) && loopback.has(target.hostname)
      && origin.port === target.port && origin.protocol === target.protocol) return;
    throw denied();
  } catch {
    throw denied();
  }
}
