import { timingSafeEqual } from "crypto";

/**
 * Constant-time check for the bot-facing platform secret. Prefers BOT_API_SECRET
 * (so the bot credential is separate from the tenant-session signing secret) and
 * falls back to PLATFORM_SECRET for backward compatibility.
 */
function expectedSecret(): string {
  return process.env.BOT_API_SECRET || process.env.PLATFORM_SECRET || "";
}

function safeEqual(provided: string, expected: string): boolean {
  if (!expected || expected.length < 16) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Validates the `x-platform-secret` header (used by pending-orders, settle, wallet). */
export function checkPlatformHeader(req: Request): boolean {
  return safeEqual(req.headers.get("x-platform-secret") ?? "", expectedSecret());
}

/** Validates an `Authorization: Bearer <secret>` header (used by migrate). */
export function checkBearer(req: Request): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return safeEqual(token, expectedSecret());
}
