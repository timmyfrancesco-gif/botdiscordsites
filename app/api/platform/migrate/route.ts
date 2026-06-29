import { NextResponse } from "next/server";
import { runMigrations } from "@/lib/db/migrate";
import { checkBearer } from "@/lib/platform/auth";
import { serverError } from "@/lib/http";

export async function POST(req: Request) {
  if (!checkBearer(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    await runMigrations();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError("platform/migrate", e, "migration failed");
  }
}
