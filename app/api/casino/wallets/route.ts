import { NextResponse } from "next/server";
import { getCasinoUser } from "@/lib/casino/auth";
import { ensureWallets } from "@/lib/casino/wallets";
import { serverError } from "@/lib/http";

export async function GET(req: Request) {
  try {
    const user = await getCasinoUser(req);
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const wallets = await ensureWallets(user.id);
    return NextResponse.json({ wallets });
  } catch (e) {
    return serverError("casino/wallets", e);
  }
}
