import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loginLogs } from "@/lib/db/schema";

/**
 * Fire-and-forget login logging, called client-side from AuthContext right
 * after a successful login (email/password or Discord). Not a security
 * boundary -- purely for the admin's own visibility into who's logging in,
 * from where, and how. Never blocks or fails the actual login: errors here
 * are swallowed both by the caller and by this route.
 */
export async function POST(req: NextRequest) {
  let body: {
    userId?: string;
    email?: string;
    username?: string;
    method?: string;
    url?: string;
    referrer?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || null;
    await db.insert(loginLogs).values({
      userId: body.userId?.slice(0, 128) ?? null,
      email: body.email?.slice(0, 254) ?? null,
      username: body.username?.slice(0, 128) ?? null,
      method: body.method?.slice(0, 32) ?? null,
      url: body.url?.slice(0, 2048) ?? null,
      referrer: body.referrer?.slice(0, 2048) ?? null,
      ip,
      userAgent: req.headers.get("user-agent")?.slice(0, 512) ?? null,
    });
  } catch {
    // best-effort only
  }

  return NextResponse.json({ ok: true });
}
