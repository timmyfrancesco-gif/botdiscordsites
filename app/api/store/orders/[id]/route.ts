import { NextResponse } from "next/server";
import { settleStoreOrder } from "@/lib/store/settle";
import { serverError } from "@/lib/http";

/**
 * Polled by the checkout page. Bot-independent: checks the temp address
 * on-chain itself and delivers/refunds via settleStoreOrder, which is the
 * single source of truth for order state transitions (also triggered by
 * the BlockCypher webhook for faster detection).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const result = await settleStoreOrder(id);
    if (!result) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (e) {
    return serverError("store/orders/[id] GET", e);
  }
}
