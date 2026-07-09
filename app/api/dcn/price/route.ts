import { NextResponse } from "next/server";
import { serverError } from "@/lib/http";

const API_BASE = (process.env.NEXT_PUBLIC_ASTRO_API_URL ?? "").replace(/\/+$/, "");

/**
 * Server-side proxy for the bot's /api/dcn/price. Deliberately strips
 * ltcPrice before it reaches the browser — the bot computes DCN's price off
 * LTC internally, but that relationship must never be visible client-side
 * (Network tab included), so the client never even receives the field.
 */
export async function GET() {
  if (!API_BASE) {
    return NextResponse.json({ price: null, updatedAt: null });
  }
  try {
    const res = await fetch(`${API_BASE}/api/dcn/price`, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ price: null, updatedAt: null });
    }
    const data = await res.json().catch(() => null);
    return NextResponse.json({
      price: typeof data?.price === "number" ? data.price : null,
      updatedAt: typeof data?.updatedAt === "number" ? data.updatedAt : null,
    });
  } catch (e) {
    return serverError("dcn-price", e);
  }
}
