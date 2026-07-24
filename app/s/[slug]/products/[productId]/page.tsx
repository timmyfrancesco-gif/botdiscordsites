import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { tenants, tenantProducts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import TenantProductPage from "./TenantProductPage";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}): Promise<Metadata> {
  const { slug, productId } = await params;
  try {
    const tenantRows = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
    if (tenantRows.length === 0) return {};
    const productRows = await db
      .select()
      .from(tenantProducts)
      .where(and(eq(tenantProducts.id, productId), eq(tenantProducts.tenantId, tenantRows[0].id)))
      .limit(1);
    if (productRows.length === 0) return {};
    return {
      title: `${productRows[0].name} — ${tenantRows[0].name}`,
      description: productRows[0].description || undefined,
    };
  } catch {
    return {};
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}) {
  const { slug, productId } = await params;

  let tenant;
  let product;
  try {
    const tenantRows = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    if (tenantRows.length === 0 || !tenantRows[0].active) return notFound();
    tenant = tenantRows[0];

    const productRows = await db
      .select()
      .from(tenantProducts)
      .where(
        and(
          eq(tenantProducts.id, productId),
          eq(tenantProducts.tenantId, tenant.id),
          eq(tenantProducts.active, true)
        )
      )
      .limit(1);

    if (productRows.length === 0) return notFound();
    product = productRows[0];
  } catch {
    return notFound();
  }

  const tenantConfig = {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      description: tenant.description ?? "",
      logo: tenant.logo,
      accentColor: tenant.accentColor,
      discordInvite: tenant.discordInvite ?? "",
    };

    const productData = {
      id: product.id,
      name: product.name,
      description: product.description ?? "",
      category: product.category ?? "Shop",
      price: product.price,
      comparePrice: product.comparePrice,
      currency: product.currency,
      stock: product.stock,
      image: product.image,
      images: (product.images as string[] | null) ?? [],
      instructions: product.instructions,
      // Strip stockItems (unsold serial keys) — a cast alone keeps them at runtime.
      variants:
        (product.variants as Array<{
          id: string;
          title: string;
          price: number;
          stock: number;
          stockItems?: string[];
        }> | null)?.map((v) => ({
          id: v.id,
          title: v.title,
          price: v.price,
          stock: v.stock,
        })) ?? null,
      deliverableType: product.deliverableType,
      totalSold: product.totalSold,
    };

  return <TenantProductPage tenant={tenantConfig} product={productData} />;
}
