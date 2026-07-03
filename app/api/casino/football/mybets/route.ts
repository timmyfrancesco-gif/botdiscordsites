import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { footballBets } from "@/lib/db/schema";
import { getCasinoUser } from "@/lib/casino/auth";
import { desc, eq } from "drizzle-orm";
import { serverError } from "@/lib/http";

export async function GET(req: Request) {
  try {
    const user = await getCasinoUser(req);
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const bets = await db
      .select()
      .from(footballBets)
      .where(eq(footballBets.userId, user.id))
      .orderBy(desc(footballBets.createdAt))
      .limit(50);
    return NextResponse.json({ bets });
  } catch (e) {
    return serverError("casino/football/mybets", e);
  }
}
