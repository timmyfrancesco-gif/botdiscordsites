import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { loginLogs } from "@/lib/db/schema";
import { hasAdminSession } from "@/lib/adminSession";
import { serverError } from "@/lib/http";

export async function GET(req: NextRequest) {
  if (!hasAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await db.select().from(loginLogs).orderBy(desc(loginLogs.createdAt)).limit(200);
    return NextResponse.json({ logs: rows });
  } catch (e) {
    return serverError("admin-login-logs", e, "failed to load login logs");
  }
}
