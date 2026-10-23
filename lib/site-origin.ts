import "server-only";

// Production redirects and CSRF checks use operator configuration, never forwarded headers.
export function siteOrigin(headers: Headers): string {
  const configured = process.env.SITE_URL;
  if (configured) {
    const url = new URL(configured);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
      throw new Error("SITE_URL must be the public HTTPS origin.");
    }
    return url.origin;
  }
  if (process.env.NODE_ENV === "production") throw new Error("SITE_URL is required in production.");
  const host = headers.get("host") || "";
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d{1,5})?$/.test(host)) throw new Error("Invalid local host.");
  return `http://${host}`;
}
