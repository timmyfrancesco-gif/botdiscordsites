import { createHmac, timingSafeEqual, randomBytes } from "crypto";

/**
 * Tenant dashboard session tokens.
 *
 * A token is `${issuedAt}.${nonce}.${HMAC(tenantId:ownerId:issuedAt:nonce)}`
 * keyed with PLATFORM_SECRET. The secret is REQUIRED — if it is missing we throw
 * rather than fall back to a guessable constant, so sessions can never be forged
 * when the platform is misconfigured.
 *
 * The signed issuedAt + TTL means a captured token cannot be replayed forever,
 * and the random nonce makes every session token unique.
 */

export const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24h, matches cookie maxAge

function getSecret(): string {
  const secret = process.env.PLATFORM_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("PLATFORM_SECRET is not configured");
  }
  return secret;
}

function mac(tenantId: string, ownerId: string, issuedAt: string, nonce: string): string {
  return createHmac("sha256", getSecret())
    .update(`${tenantId}:${ownerId}:${issuedAt}:${nonce}`)
    .digest("hex");
}

export function signSession(tenantId: string, ownerId: string): string {
  const issuedAt = Date.now().toString();
  const nonce = randomBytes(16).toString("hex");
  return `${issuedAt}.${nonce}.${mac(tenantId, ownerId, issuedAt, nonce)}`;
}

export function verifySession(
  token: string | undefined | null,
  tenantId: string,
  ownerId: string
): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [issuedAt, nonce, providedMac] = parts;

  const ts = Number(issuedAt);
  if (!Number.isFinite(ts) || Date.now() - ts > SESSION_TTL_MS) return false;

  let expected: string;
  try {
    expected = mac(tenantId, ownerId, issuedAt, nonce);
  } catch {
    return false;
  }
  const a = Buffer.from(providedMac);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function readSessionCookie(req: Request): string | undefined {
  const cookieHeader = req.headers.get("cookie") ?? "";
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    if (name === "tenant_session") {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return undefined;
}
