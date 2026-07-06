import { db } from "@/lib/db";
import { storeOrders } from "@/lib/db/schema";
import { and, eq, lt } from "drizzle-orm";
import { getAddressReceived } from "@/lib/crypto/wallet";
import { decryptSecret } from "@/lib/crypto/secrets";
import { getPayerAddress, sendFromTempWallet } from "@/lib/crypto/ltcSend";
import { consumeOne } from "./inventory";

const MIN_CONFIRMATIONS = Number(process.env.LTC_MIN_CONFIRMATIONS ?? "1");
// Orders below this EUR amount settle as soon as the payment is SEEN
// (0 confirmations / mempool), trading a small double-spend risk for much
// faster checkout and fewer BlockCypher polls. Higher-value orders still
// wait for MIN_CONFIRMATIONS.
const ZERO_CONF_THRESHOLD_EUR = Number(process.env.LTC_ZERO_CONF_THRESHOLD_EUR ?? "20");
const AMOUNT_TOLERANCE = 0.01; // 1%, absorbs rounding/network fee dust
const ORDER_TTL_MS = 1000 * 60 * 15; // unpaid orders expire after 15 min
// Flat, conservative miner fee reserved out of every refund. LTC network fees
// are typically far below this; the small remainder left at the temp address
// is an acceptable cost of never failing a refund broadcast for lack of fee.
const REFUND_FEE_SATOSHI = 50_000; // 0.0005 LTC

export interface SettleResult {
  status: string;
  deliveredItem?: string | null;
  confirmations?: number;
  requiredConfirmations?: number;
  refundTxHash?: string | null;
}

/**
 * Advances a single pending order's state based on real on-chain activity.
 * Safe to call repeatedly and concurrently (webhook + client poll can race
 * freely) — every state transition is gated by an optimistic-concurrency
 * UPDATE, so only one caller ever performs the actual delivery or refund.
 */
export async function settleStoreOrder(orderId: string): Promise<SettleResult | null> {
  const [order] = await db.select().from(storeOrders).where(eq(storeOrders.id, orderId)).limit(1);
  if (!order) return null;

  // Retry a refund that didn't finish (network hiccup mid-broadcast, etc).
  if (order.status === "oversold_refunding" || order.status === "refund_failed") {
    return retryRefund(order);
  }

  if (order.status !== "pending") {
    return {
      status: order.status,
      deliveredItem: order.status === "paid" ? order.deliveredItem : undefined,
      refundTxHash: order.status === "refunded" ? order.refundTxHash : undefined,
    };
  }

  if (Date.now() - order.createdAt.getTime() > ORDER_TTL_MS) {
    await db
      .update(storeOrders)
      .set({ status: "expired", updatedAt: new Date() })
      .where(and(eq(storeOrders.id, orderId), eq(storeOrders.status, "pending")));
    return { status: "expired" };
  }

  if (!order.ltcAddress || !order.amountLtc) return { status: "pending" };

  const received = await getAddressReceived("ltc", order.ltcAddress);
  if (!received) return { status: "pending" };

  const requiredConfirmations = order.amountEur < ZERO_CONF_THRESHOLD_EUR ? 0 : MIN_CONFIRMATIONS;
  // 0-conf orders count the payment the instant it's seen in the mempool, so
  // unconfirmed balance counts toward the required amount too.
  const effectiveReceivedLtc =
    requiredConfirmations === 0 ? received.receivedLtc + received.unconfirmedLtc : received.receivedLtc;
  const required = order.amountLtc * (1 - AMOUNT_TOLERANCE);
  if (effectiveReceivedLtc < required || received.confirmations < requiredConfirmations) {
    return { status: "pending", confirmations: received.confirmations, requiredConfirmations };
  }

  // Payment confirmed (or seen, for 0-conf orders). Exclusively claim this
  // order before touching stock — stops a concurrent webhook+poll pair from
  // both consuming a stock item for the same single payment.
  const claimed = await db
    .update(storeOrders)
    .set({ status: "settling", confirmations: received.confirmations, updatedAt: new Date() })
    .where(and(eq(storeOrders.id, orderId), eq(storeOrders.status, "pending")))
    .returning({ id: storeOrders.id });

  if (claimed.length === 0) {
    // Another call already won the race to settle this order.
    const [fresh] = await db.select().from(storeOrders).where(eq(storeOrders.id, orderId)).limit(1);
    return { status: fresh?.status ?? "pending", deliveredItem: fresh?.deliveredItem };
  }

  // The actual allocation authority: whichever confirmed payment gets here
  // first for the last unit of stock wins it. Later ones fall through to refund.
  const deliveredItem = await consumeOne(order.productId, order.id);
  if (deliveredItem) {
    await db
      .update(storeOrders)
      .set({ status: "paid", deliveredItem, updatedAt: new Date() })
      .where(eq(storeOrders.id, orderId));
    return { status: "paid", deliveredItem };
  }

  // Oversold: this payment cleared after the stock was already fully claimed
  // by earlier payers. Refund it automatically to whoever sent it.
  await db
    .update(storeOrders)
    .set({ status: "oversold_refunding", updatedAt: new Date() })
    .where(eq(storeOrders.id, orderId));
  const [fresh] = await db.select().from(storeOrders).where(eq(storeOrders.id, orderId)).limit(1);
  return retryRefund(fresh);
}

async function retryRefund(order: typeof storeOrders.$inferSelect): Promise<SettleResult> {
  if (!order.ltcAddress || !order.payPrivateKey) {
    return { status: "refund_failed" };
  }

  // Idempotency: if the temp address balance is already gone, either this
  // refund already succeeded (crashed before we recorded it) or funds were
  // never really there — either way, don't broadcast a second time.
  const current = await getAddressReceived("ltc", order.ltcAddress);
  const receivedSatoshi = Math.round((current?.receivedLtc ?? 0) * 1e8);
  const alreadySwept = receivedSatoshi > 0 && receivedSatoshi <= REFUND_FEE_SATOSHI;
  if (alreadySwept) {
    await db
      .update(storeOrders)
      .set({ status: "refunded", updatedAt: new Date() })
      .where(eq(storeOrders.id, order.id));
    return { status: "refunded" };
  }

  const refundAddress = order.refundAddress ?? (await getPayerAddress("ltc", order.ltcAddress));
  if (!refundAddress) {
    await db
      .update(storeOrders)
      .set({ status: "refund_failed", updatedAt: new Date() })
      .where(eq(storeOrders.id, order.id));
    return { status: "refund_failed" };
  }
  if (!order.refundAddress) {
    await db.update(storeOrders).set({ refundAddress }).where(eq(storeOrders.id, order.id));
  }

  const wif = decryptSecret(order.payPrivateKey);
  if (!wif) {
    return { status: "refund_failed" };
  }

  const outputSatoshi = receivedSatoshi - REFUND_FEE_SATOSHI;
  if (outputSatoshi <= 0) {
    await db
      .update(storeOrders)
      .set({ status: "refund_failed", updatedAt: new Date() })
      .where(eq(storeOrders.id, order.id));
    return { status: "refund_failed" };
  }

  const result = await sendFromTempWallet(
    "ltc",
    order.ltcAddress,
    wif,
    refundAddress,
    outputSatoshi,
    REFUND_FEE_SATOSHI
  );

  if (result.ok) {
    await db
      .update(storeOrders)
      .set({ status: "refunded", refundTxHash: result.txHash ?? null, updatedAt: new Date() })
      .where(eq(storeOrders.id, order.id));
    return { status: "refunded", refundTxHash: result.txHash };
  }

  // Leave status as oversold_refunding/refund_failed so the next poll retries.
  await db
    .update(storeOrders)
    .set({ status: "refund_failed", updatedAt: new Date() })
    .where(eq(storeOrders.id, order.id));
  return { status: "refund_failed" };
}

/** Opportunistic sweep: expires abandoned pending store orders (no refund needed — nothing was ever reserved). */
export async function expireStalestoreOrders(): Promise<number> {
  const cutoff = new Date(Date.now() - ORDER_TTL_MS);
  const expired = await db
    .update(storeOrders)
    .set({ status: "expired", updatedAt: new Date() })
    .where(and(eq(storeOrders.status, "pending"), lt(storeOrders.createdAt, cutoff)))
    .returning({ id: storeOrders.id });
  return expired.length;
}
