import { NextResponse } from "next/server";
import { runMigrations } from "@/lib/db/migrate";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.PLATFORM_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    await runMigrations();
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const err = e as Record<string, unknown>;
    return NextResponse.json(
      {
        error: err?.message ?? "unknown error",
        code: err?.code,
        detail: err?.detail,
        dbUrl: process.env.DATABASE_URL
          ? `${process.env.DATABASE_URL.slice(0, 30)}...`
          : "NOT SET",
      },
      { status: 500 }
    );
  }
}
