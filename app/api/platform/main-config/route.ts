import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkPlatformHeader } from "@/lib/platform/auth";
import { serverError } from "@/lib/http";

/**
 * Bot-facing: exposes the main site's payment config (the PayPal email set
 * from the admin Configure page) so the bot can show it at checkout and match
 * incoming PayPal notification emails for main-site orders.
 */
export async function GET(req: Request) {
  if (!checkPlatformHeader(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const rows = await db.select().from(siteConfig).where(eq(siteConfig.id, 1)).limit(1);
    const c = (rows[0]?.config ?? {}) as Record<string, unknown>;
    return NextResponse.json({
      paypalEmail: typeof c.mainPaypalEmail === "string" ? c.mainPaypalEmail : null,
    });
  } catch (e) {
    return serverError("platform/main-config", e);
  }
}
