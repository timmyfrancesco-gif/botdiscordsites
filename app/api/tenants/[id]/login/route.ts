import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { signSession, SESSION_TTL_MS } from "@/lib/tenant/session";
import { verifyPassword, hashPassword, needsRehash } from "@/lib/auth/password";
import { serverError } from "@/lib/http";

// A valid-looking scrypt hash for a random password, used to equalize timing
// when the user/tenant doesn't exist so login can't be used as an oracle.
const DUMMY_HASH =
  "scrypt$16384$8$1$00000000000000000000000000000000$" +
  "0".repeat(128);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tenantId } = await params;

  try {
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password required" },
        { status: 400 }
      );
    }

    const tenantRows = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);
    const tenant = tenantRows[0];

    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    const user = userRows[0];

    // Always run a hash to flatten timing whether or not the account exists.
    const passwordOk = verifyPassword(user?.passwordHash ?? DUMMY_HASH, password);

    const authorized = Boolean(
      tenant && user && passwordOk && tenant.ownerId === user.id
    );
    if (!authorized || !tenant || !user) {
      // Single uniform failure — never reveal which check failed.
      return NextResponse.json(
        { error: "invalid credentials" },
        { status: 401 }
      );
    }

    // Transparently migrate legacy SHA-256 hashes to scrypt on successful login.
    if (needsRehash(user.passwordHash)) {
      try {
        await db
          .update(users)
          .set({ passwordHash: hashPassword(password) })
          .where(eq(users.id, user.id));
      } catch {
        // non-fatal: migration can retry next login
      }
    }

    let sessionToken: string;
    try {
      sessionToken = signSession(tenantId, user.id);
    } catch {
      return NextResponse.json(
        { error: "server misconfigured" },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, username: user.username },
    });

    response.cookies.set("tenant_session", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
    });

    return response;
  } catch (e) {
    return serverError("tenants/login", e);
  }
}
