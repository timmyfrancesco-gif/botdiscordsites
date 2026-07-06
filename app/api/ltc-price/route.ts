import { NextResponse } from "next/server";
import { getLtcPrices } from "@/lib/crypto/wallet";
import { serverError } from "@/lib/http";

/**
 * Always-live LTC/EUR/USD price for the checkout page — CoinGecko/Binance,
 * never the bot's own feed (which can lag behind the rate actually used to
 * compute orders server-side).
 */
export async function GET() {
  try {
    const prices = await getLtcPrices();
    if (!prices) return NextResponse.json({ error: "price unavailable" }, { status: 503 });
    return NextResponse.json(prices);
  } catch (e) {
    return serverError("ltc-price", e);
  }
}
