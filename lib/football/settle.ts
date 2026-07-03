import { db } from "@/lib/db";
import { footballBets } from "@/lib/db/schema";
import { and, eq, lt } from "drizzle-orm";
import { getFixtureResult } from "./api";
import { creditBalance } from "@/lib/casino/auth";

/**
 * Settles pending football bets whose match has kicked off. One API-Football
 * call per distinct fixture (batched), so the daily budget is respected.
 * Idempotent: only rows still `pending` are updated (optimistic concurrency).
 */
export async function settleFootballBets(): Promise<{ settled: number }> {
  const now = new Date();
  const pending = await db
    .select()
    .from(footballBets)
    .where(and(eq(footballBets.status, "pending"), lt(footballBets.kickoff, now)));

  if (pending.length === 0) return { settled: 0 };

  const fixtureIds = [...new Set(pending.map((b) => b.fixtureId))];
  const results = new Map<number, Awaited<ReturnType<typeof getFixtureResult>>>();
  for (const fid of fixtureIds) {
    results.set(fid, await getFixtureResult(fid));
  }

  let settled = 0;
  for (const bet of pending) {
    const r = results.get(bet.fixtureId);
    if (!r || !r.finished || !r.winner) continue;

    const won = r.winner === bet.selection;
    const payoutCents = won ? Math.floor(bet.stakeCents * bet.odds) : 0;

    const updated = await db
      .update(footballBets)
      .set({
        status: won ? "won" : "lost",
        payoutCents,
        settledAt: new Date(),
      })
      .where(and(eq(footballBets.id, bet.id), eq(footballBets.status, "pending")))
      .returning({ id: footballBets.id });
    if (updated.length === 0) continue; // settled concurrently

    if (won && payoutCents > 0) {
      await creditBalance({ id: bet.userId, username: null }, payoutCents);
    }
    settled++;
  }
  return { settled };
}
