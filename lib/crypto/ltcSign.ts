import bs58check from "bs58check";
import { ec as EC } from "elliptic";

/**
 * Raw secp256k1 signing for BlockCypher's "New Transaction" flow
 * (POST /txs/new -> sign each `tosign` hash locally -> POST /txs/send).
 * BlockCypher never receives our private key — only the signatures we
 * compute here, which is the documented, correct way to send funds
 * programmatically.
 */

const secp256k1 = new EC("secp256k1");

interface DecodedWif {
  privateKeyHex: string;
  compressed: boolean;
}

/** Decodes a WIF private key (as returned by BlockCypher wallet generation). */
export function decodeWif(wif: string): DecodedWif {
  const payload = bs58check.decode(wif);
  // payload: [version byte][32-byte key][optional 0x01 compressed-flag byte]
  const compressed = payload.length === 34 && payload[33] === 0x01;
  const privateKeyHex = Buffer.from(payload.subarray(1, 33)).toString("hex");
  return { privateKeyHex, compressed };
}

/** Public key (hex) derived from a WIF, in the same compression as the WIF. */
export function publicKeyFromWif(wif: string): string {
  const { privateKeyHex, compressed } = decodeWif(wif);
  const key = secp256k1.keyFromPrivate(privateKeyHex, "hex");
  return key.getPublic(compressed, "hex");
}

/**
 * Signs each hex-encoded hash in `toSign` with the given WIF private key.
 * Returns DER-encoded, low-S signatures (hex) — the format BlockCypher expects.
 */
export function signHashes(wif: string, toSign: string[]): { signatures: string[]; pubkeys: string[] } {
  const { privateKeyHex, compressed } = decodeWif(wif);
  const key = secp256k1.keyFromPrivate(privateKeyHex, "hex");
  const pubkey = key.getPublic(compressed, "hex");

  const signatures = toSign.map((hashHex) => {
    const signature = key.sign(Buffer.from(hashHex, "hex"), { canonical: true });
    return signature.toDER("hex");
  });

  return { signatures, pubkeys: toSign.map(() => pubkey) };
}
