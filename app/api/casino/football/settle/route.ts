import { NextResponse } from "next/server";
import { checkPlatformHeader } from "@/lib/platform/auth";
import { settleFootballBets } from "@/lib/football/settle";
import { serverError } from "@/lib/http";

// Settlement is budget-sensitive (one API call per finished fixture), so it's
// restricted to the daily Vercel Cron / platform secret, not open to users.
function authorized(req: Request): boolean {
  if (checkPlatformHeader(req)) return true;
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${cronSecret}`;
}

export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}

async function run(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const res = await settleFootballBets();
    return NextResponse.json({ ok: true, ...res });
  } catch (e) {
    return serverError("casino/football/settle", e);
  }
}
