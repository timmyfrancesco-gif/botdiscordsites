import { db } from "@/lib/db";
import { casinoWallets } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { encryptSecret } from "@/lib/crypto/secrets";
import {
  CHAIN_LIST,
  CHAINS,
  type Chain,
  generateAddress,
  registerWebhook,
  getTotalReceivedAtomic,
  getPricesEur,
  atomicToEurCents,
} from "./crypto";
import { creditBalance } from "./auth";

function baseUrl(): string {
  const d = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "";
  if (!d) return "";
  return d.startsWith("http") ? d : `https://${d}`;
}

function webhookSecret(): string {
  return (
    process.env.CASINO_WEBHOOK_SECRET ||
    process.env.BOT_API_SECRET ||
    process.env.PLATFORM_SECRET ||
    ""
  );
}

export interface WalletView {
  chain: Chain;
  address: string;
  symbol: string;
  label: string;
}

/**
 * Returns the user's deposit addresses, creating any missing chain on demand.
 * Addresses are generated once and persisted, so they never change for a user.
 */
export async function ensureWallets(userId: string): Promise<WalletView[]> {
  const existing = await db
    .select()
    .from(casinoWallets)
    .where(eq(casinoWallets.userId, userId));
  const byChain = new Map(existing.map((w) => [w.chain, w]));
  const out: WalletView[] = [];

  for (const chain of CHAIN_LIST) {
    const have = byChain.get(chain);
    if (have) {
      out.push({ chain, address: have.address, symbol: CHAINS[chain].symbol, label: CHAINS[chain].label });
      continue;
    }
    const gen = await generateAddress(chain);
    if (!gen) continue; // provider hiccup — retried on next load
    await db
      .insert(casinoWallets)
      .values({ userId, chain, address: gen.address, privateKey: encryptSecret(gen.privateKey) })
      .onConflictDoNothing();

    // Real-time deposit push (best-effort; the manual check is the fallback).
    const base = baseUrl();
    if (base) {
      const cb = `${base}/api/casino/deposits/webhook?s=${encodeURIComponent(webhookSecret())}&addr=${encodeURIComponent(gen.address)}`;
      await registerWebhook(chain, gen.address, cb);
    }
    out.push({ chain, address: gen.address, symbol: CHAINS[chain].symbol, label: CHAINS[chain].label });
  }
  return out;
}

export interface CreditResult {
  credited: { chain: Chain; eurCents: number }[];
  balanceCents: number | null;
}

/**
 * Re-reads each of the user's addresses on-chain and credits any funds not yet
 * credited. Idempotent: creditedAtomic tracks what's already been applied, so
 * repeated calls (webhook retries, manual checks) never double-credit.
 */
export async function creditDeposits(userId: string, onlyAddress?: string): Promise<CreditResult> {
  const wallets = await db
    .select()
    .from(casinoWallets)
    .where(
      onlyAddress
        ? and(eq(casinoWallets.userId, userId), eq(casinoWallets.address, onlyAddress))
        : eq(casinoWallets.userId, userId)
    );
  if (wallets.length === 0) return { credited: [], balanceCents: null };

  const prices = await getPricesEur();
  const credited: { chain: Chain; eurCents: number }[] = [];
  let balanceCents: number | null = null;

  for (const w of wallets) {
    const chain = w.chain as Chain;
    const price = prices[chain];
    if (!price) continue; // no price → skip, credit on a later check
    const received = await getTotalReceivedAtomic(chain, w.address);
    if (received === null) continue;

    const already = BigInt(w.creditedAtomic || "0");
    if (received <= already) continue;

    const diff = received - already;
    const eurCents = atomicToEurCents(chain, diff, price);
    if (eurCents > 0) {
      balanceCents = await creditBalance({ id: userId, username: null }, eurCents);
      credited.push({ chain, eurCents });
    }
    // Mark the full received amount as processed (even if dust rounded to 0)
    // so we don't reprocess it forever.
    await db
      .update(casinoWallets)
      .set({ creditedAtomic: received.toString() })
      .where(eq(casinoWallets.id, w.id));
  }

  return { credited, balanceCents };
}

/** Looks up which user owns a deposit address (for webhook routing). */
export async function userForAddress(address: string): Promise<string | null> {
  const rows = await db
    .select({ userId: casinoWallets.userId })
    .from(casinoWallets)
    .where(eq(casinoWallets.address, address))
    .limit(1);
  return rows[0]?.userId ?? null;
}

export function checkWebhookSecret(provided: string): boolean {
  const expected = webhookSecret();
  return expected.length > 0 && provided === expected;
}
