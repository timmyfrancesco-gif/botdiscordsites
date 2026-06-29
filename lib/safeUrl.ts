/**
 * Returns the URL only if it is a safe absolute http(s) link, otherwise a
 * harmless fallback ("#"). Prevents javascript:/data: and other scheme abuse
 * (stored XSS / open redirect) when rendering user-controlled links such as a
 * tenant's discord invite.
 */
export function safeExternalUrl(url: string | null | undefined, fallback = "#"): string {
  if (!url) return fallback;
  try {
    const u = new URL(url);
    if (u.protocol === "https:" || u.protocol === "http:") return url;
  } catch {
    // not an absolute URL
  }
  return fallback;
}
