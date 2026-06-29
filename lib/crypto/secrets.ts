import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * Reversible authenticated encryption for secrets stored at rest (wallet
 * private keys). Uses AES-256-GCM with a 32-byte key from WALLET_ENC_KEY
 * (base64 or hex).
 *
 * Backward compatible: if WALLET_ENC_KEY is not configured, values are stored
 * as-is (legacy plaintext) so the platform keeps working; decryptSecret reads
 * both encrypted ("gcm:" prefixed) and legacy plaintext values. Set
 * WALLET_ENC_KEY to enable encryption — new writes are then encrypted while old
 * plaintext rows still decrypt.
 */

const PREFIX = "gcm:";

function loadKey(): Buffer | null {
  const raw = process.env.WALLET_ENC_KEY;
  if (!raw) return null;
  let key: Buffer;
  try {
    key = raw.length === 64 ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  } catch {
    return null;
  }
  return key.length === 32 ? key : null;
}

export function isEncryptionEnabled(): boolean {
  return loadKey() !== null;
}

export function encryptSecret(plain: string): string {
  const key = loadKey();
  if (!key) return plain; // legacy plaintext fallback
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

export function decryptSecret(blob: string | null | undefined): string | null {
  if (!blob) return null;
  if (!blob.startsWith(PREFIX)) return blob; // legacy plaintext
  const key = loadKey();
  if (!key) return null; // encrypted value but no key available
  try {
    const [ivB64, tagB64, ctB64] = blob.slice(PREFIX.length).split(":");
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const ct = Buffer.from(ctB64, "base64");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
