import { db } from "@/lib/db";
import { footballCache } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * API-Football (api-sports.io) client. Free plan = 100 requests/day, so every
 * response is cached in the DB with a TTL to stay well under the limit even
 * across serverless instances.
 */

const HOST = "https://v3.football.api-sports.io";

function key(): string {
  return process.env.API_FOOTBALL_KEY ?? "";
}

// Configurable so you can point at any league/season without a code change.
export function leagueId(): number {
  return Number(process.env.FOOTBALL_LEAGUE ?? "135"); // default: Serie A
}
export function season(): number {
  return Number(process.env.FOOTBALL_SEASON ?? "2024");
}

async function cached<T>(cacheKey: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const rows = await db.select().from(footballCache).where(eq(footballCache.key, cacheKey)).limit(1);
  const now = Date.now();
  if (rows.length > 0 && now - rows[0].fetchedAt.getTime() < ttlMs) {
    return rows[0].data as T;
  }
  const data = await fetcher();
  await db
    .insert(footballCache)
    .values({ key: cacheKey, data, fetchedAt: new Date() })
    .onConflictDoUpdate({ target: footballCache.key, set: { data, fetchedAt: new Date() } });
  return data;
}

async function apiGet(path: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${HOST}${path}`, {
    headers: { "x-apisports-key": key() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`api-football ${res.status}`);
  return res.json();
}

export interface Match {
  fixtureId: number;
  league: string;
  home: string;
  away: string;
  kickoff: string;
  status: string;
  odds: { home: number; draw: number; away: number } | null;
}

/** Upcoming fixtures for the configured league with 1X2 (Match Winner) odds. */
export async function getMatches(): Promise<Match[]> {
  if (!key()) return [];
  const lid = leagueId();
  const s = season();

  // Cache both calls for 15 minutes → at most ~192 calls/day even if polled hard.
  const [fixturesRes, oddsRes] = await Promise.all([
    cached(`fixtures:${lid}:${s}`, 15 * 60_000, () =>
      apiGet(`/fixtures?league=${lid}&season=${s}&next=20`)
    ),
    cached(`odds:${lid}:${s}`, 15 * 60_000, () =>
      apiGet(`/odds?league=${lid}&season=${s}&bet=1`)
    ),
  ]);

  const oddsByFixture = new Map<number, { home: number; draw: number; away: number }>();
  for (const o of (oddsRes.response as unknown[]) ?? []) {
    const rec = o as {
      fixture?: { id?: number };
      bookmakers?: { bets?: { id?: number; values?: { value?: string; odd?: string }[] }[] }[];
    };
    const fid = rec.fixture?.id;
    if (!fid) continue;
    const bet = rec.bookmakers?.[0]?.bets?.find((b) => b.id === 1);
    if (!bet?.values) continue;
    const get = (v: string) => Number(bet.values!.find((x) => x.value === v)?.odd);
    const home = get("Home");
    const draw = get("Draw");
    const away = get("Away");
    if (home && draw && away) oddsByFixture.set(fid, { home, draw, away });
  }

  const out: Match[] = [];
  for (const f of (fixturesRes.response as unknown[]) ?? []) {
    const rec = f as {
      fixture?: { id?: number; date?: string; status?: { short?: string } };
      league?: { name?: string };
      teams?: { home?: { name?: string }; away?: { name?: string } };
    };
    const fid = rec.fixture?.id;
    if (!fid) continue;
    out.push({
      fixtureId: fid,
      league: rec.league?.name ?? "",
      home: rec.teams?.home?.name ?? "",
      away: rec.teams?.away?.name ?? "",
      kickoff: rec.fixture?.date ?? "",
      status: rec.fixture?.status?.short ?? "NS",
      odds: oddsByFixture.get(fid) ?? null,
    });
  }
  return out;
}

export interface FixtureResult {
  finished: boolean;
  winner: "home" | "draw" | "away" | null;
}

/** Final result for a fixture (used to settle bets). */
export async function getFixtureResult(fixtureId: number): Promise<FixtureResult | null> {
  if (!key()) return null;
  try {
    const data = await apiGet(`/fixtures?id=${fixtureId}`);
    const rec = (data.response as unknown[])?.[0] as {
      fixture?: { status?: { short?: string } };
      goals?: { home?: number; away?: number };
    };
    if (!rec) return null;
    const short = rec.fixture?.status?.short ?? "";
    const finished = ["FT", "AET", "PEN"].includes(short);
    if (!finished) return { finished: false, winner: null };
    const h = rec.goals?.home ?? 0;
    const a = rec.goals?.away ?? 0;
    return { finished: true, winner: h > a ? "home" : a > h ? "away" : "draw" };
  } catch {
    return null;
  }
}
