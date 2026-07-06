import { NextResponse } from "next/server";
import { getCasinoUser, getBalanceCents } from "@/lib/casino/auth";
import { creditDeposits } from "@/lib/casino/wallets";
import { serverError } from "@/lib/http";

// Manual/opportunistic deposit check (the deposit page polls this while open).
export async function POST(req: Request) {
  try {
    const user = await getCasinoUser(req);
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const address = typeof body?.address === "string" ? body.address : undefined;
    const res = await creditDeposits(user.id, address);
    const balanceCents = res.balanceCents ?? (await getBalanceCents(user));
    return NextResponse.json({ credited: res.credited, balanceCents });
  } catch (e) {
    return serverError("casino/deposits/check", e);
  }
}
