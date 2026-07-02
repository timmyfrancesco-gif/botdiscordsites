import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/adminSession";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";

const PAYPAL_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** List all shops with their current PayPal email (admin only). */
export async function GET(req: NextRequest) {
  if (!hasAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await db
    .select({
      id: tenants.id,
      slug: tenants.slug,
      name: tenants.name,
      paypalEmail: tenants.paypalEmail,
      ltcAddress: tenants.ltcAddress,
    })
    .from(tenants)
    .orderBy(asc(tenants.createdAt));
  return NextResponse.json({ tenants: rows });
}

/** Set (or clear) the PayPal email of a specific shop (admin only). */
export async function PUT(req: NextRequest) {
  if (!hasAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let tenantId: string, paypalEmail: string;
  try {
    const body = await req.json();
    tenantId = body?.tenantId;
    paypalEmail = (body?.paypalEmail ?? "").trim();
    if (!tenantId) throw new Error();
  } catch {
    return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
  }

  if (paypalEmail !== "" && (!PAYPAL_EMAIL_RE.test(paypalEmail) || paypalEmail.length > 254)) {
    return NextResponse.json({ error: "invalid PayPal email" }, { status: 400 });
  }

  const updated = await db
    .update(tenants)
    .set({ paypalEmail: paypalEmail || null, updatedAt: new Date() })
    .where(eq(tenants.id, tenantId))
    .returning({ id: tenants.id });

  if (updated.length === 0) {
    return NextResponse.json({ error: "shop not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
