import { NextResponse } from "next/server";
import { checkWebhookSecret, userForAddress, creditDeposits } from "@/lib/casino/wallets";
import { serverError } from "@/lib/http";

/**
 * BlockCypher deposit webhook. The callback URL carries the address and a
 * shared secret. We don't trust the payload amounts — we re-read the address
 * on-chain and credit idempotently, so a spoofed or replayed call can't
 * inflate a balance.
 */
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("s") ?? "";
    const address = searchParams.get("addr") ?? "";
    if (!checkWebhookSecret(secret) || !address) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const userId = await userForAddress(address);
    if (!userId) return NextResponse.json({ ok: true }); // unknown address, ignore

    await creditDeposits(userId, address);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError("casino/deposits/webhook", e);
  }
}

// BlockCypher pings the URL with GET when creating a hook to validate it.
export async function GET() {
  return NextResponse.json({ ok: true });
}
