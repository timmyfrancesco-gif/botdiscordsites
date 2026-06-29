import { scryptSync, randomBytes, createHash, timingSafeEqual } from "crypto";

/**
 * Password hashing using scrypt (memory-hard KDF, no external dependency).
 * Stored format: `scrypt$N$r$p$saltHex$hashHex`.
 *
 * verifyPassword also accepts the legacy single-round SHA-256 format
 * (`salt:hash`) so existing accounts keep working; callers should re-hash with
 * hashPassword() after a successful legacy login to migrate them.
 */

const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(stored: string, input: string): boolean {
  if (stored.startsWith("scrypt$")) {
    const [, ns, rs, ps, saltHex, hashHex] = stored.split("$");
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    let derived: Buffer;
    try {
      derived = scryptSync(input, salt, expected.length, {
        N: Number(ns),
        r: Number(rs),
        p: Number(ps),
      });
    } catch {
      return false;
    }
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  }

  // Legacy single-round SHA-256 format: salt:hash
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const inputHash = createHash("sha256").update(salt + input).digest("hex");
  const a = Buffer.from(hash);
  const b = Buffer.from(inputHash);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** True if the stored hash uses the legacy format and should be re-hashed. */
export function needsRehash(stored: string): boolean {
  return !stored.startsWith("scrypt$");
}
