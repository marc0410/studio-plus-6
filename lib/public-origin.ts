/** Browser-safe canonical public-site origin; its only environment value is intentionally public. */
export function publicSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_HOST_WWW?.trim().toLowerCase().replace(/\.$/, "");
  const currentHost = typeof window !== "undefined" ? window.location.host.toLowerCase() : "";
  const isLocal = currentHost === "localhost:3000" || currentHost.endsWith(".localhost:3000");
  const isPreview = currentHost === "dev.studioplusci.com" || currentHost.startsWith("dev-");
  const host = configured || (isLocal ? "localhost:3000" : isPreview ? "dev.studioplusci.com" : "www.studioplusci.com");
  return host.includes("localhost") ? `http://${host}` : `https://${host}`;
}
