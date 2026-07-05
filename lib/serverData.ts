import type {
  ApiProduct,
  FeedResponse,
  LtcResponse,
  ProductsResponse,
  ReviewsResponse,
  SmmProductsResponse,
  StatsResponse,
} from "./types";
import { listProducts } from "./store/inventory";

const API_BASE = (process.env.NEXT_PUBLIC_ASTRO_API_URL ?? "").replace(/\/+$/, "");

async function serverFetch<T>(path: string): Promise<T | null> {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export interface HomepageServerData {
  stats: StatsResponse | null;
  products: ProductsResponse | null;
  feed: FeedResponse | null;
  ltc: LtcResponse | null;
  reviews: ReviewsResponse | null;
  smmProducts: SmmProductsResponse | null;
}

export async function fetchHomepageData(): Promise<HomepageServerData> {
  const [stats, botProducts, feed, ltc, reviews, smmProducts, platformProducts] = await Promise.all([
    serverFetch<StatsResponse>("/api/stats"),
    serverFetch<ProductsResponse>("/api/products"),
    serverFetch<FeedResponse>("/api/feed?limit=15"),
    serverFetch<LtcResponse>("/api/ltc"),
    serverFetch<ReviewsResponse>("/api/reviews"),
    serverFetch<SmmProductsResponse>("/api/smm-products"),
    // Reliable Postgres-backed products — fetched directly (server-side, same
    // process) so they appear on first render, not just after the client's
    // delayed poll picks them up.
    listProducts(true).catch(() => []),
  ]);

  const platformAsApiProducts: ApiProduct[] = platformProducts.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    currency: p.currency,
    stock: p.stock,
    image: p.image ?? undefined,
    description: p.description,
    category: p.category,
    deliverableType: "serials",
    totalSold: p.totalSold,
    active: p.active,
    source: "platform",
  }));

  const products: ProductsResponse = {
    products: [...platformAsApiProducts, ...(botProducts?.products ?? [])],
  };

  return { stats, products, feed, ltc, reviews, smmProducts };
}
