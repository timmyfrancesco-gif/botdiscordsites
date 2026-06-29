import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { generateWallet } from "@/lib/crypto/wallet";
import { encryptSecret } from "@/lib/crypto/secrets";
import { hashPassword } from "@/lib/auth/password";
import { serverError } from "@/lib/http";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, username, password, shopName, shopSlug, shopLogo, shopDescription } = body as {
      email?: string;
      username?: string;
      password?: string;
      shopName?: string;
      shopSlug?: string;
      shopLogo?: string;
      shopDescription?: string;
    };

    if (!email || !password || !shopName) {
      return NextResponse.json(
        { error: "email, password, and shopName are required" },
        { status: 400 }
      );
    }

    const resolvedUsername = username || email.split("@")[0];

    if (password.length < 8) {
      return NextResponse.json(
        { error: "password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "email already registered" },
        { status: 409 }
      );
    }

    let slug = shopSlug ? slugify(shopSlug) : slugify(shopName);
    if (!slug) slug = `shop-${randomBytes(4).toString("hex")}`;

    const existingSlug = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);
    if (existingSlug.length > 0) {
      slug = `${slug}-${randomBytes(3).toString("hex")}`;
    }

    const [ltcWallet, btcWallet] = await Promise.all([
      generateWallet("ltc"),
      generateWallet("btc"),
    ]);

    // Insert user + tenant in one transaction so a failure can't leave an
    // orphan user that blocks re-registration with the same email.
    const { user, tenant } = await db.transaction(async (tx) => {
      const [u] = await tx
        .insert(users)
        .values({
          email: email.toLowerCase(),
          username: resolvedUsername,
          passwordHash: hashPassword(password),
        })
        .returning();

      const [t] = await tx
        .insert(tenants)
        .values({
          slug,
          name: shopName,
          ownerId: u.id,
          logo: shopLogo || null,
          description: shopDescription || "",
          ltcAddress: ltcWallet?.address || null,
          ltcPrivateKey: ltcWallet ? encryptSecret(ltcWallet.privateKey) : null,
          btcAddress: btcWallet?.address || null,
          btcPrivateKey: btcWallet ? encryptSecret(btcWallet.privateKey) : null,
        })
        .returning();

      return { user: u, tenant: t };
    });

    return NextResponse.json({
      user: { id: user.id, email: user.email, username: user.username },
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
      },
      walletReady: !!ltcWallet,
    });
  } catch (e) {
    return serverError("tenants/register", e);
  }
}
