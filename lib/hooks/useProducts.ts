"use client";

import { useCallback, useEffect, useState } from "react";
import type { ShopItem } from "@/lib/types";

interface ApiProduct {
  id: string | number;
  name: string;
  category?: string;
  price: number;
  comparePrice?: number;
  currency?: string;
  stock: number;
  description?: string;
  image?: string;
  images?: string[];
  url?: string;
  instructions?: string;
  variants?: Array<{
    id: string;
    title: string;
    price: number;
    stock: number;
    stockItems?: string[];
  }>;
  deliverableType?: string;
  totalSold?: number;
}

interface ProductsApiResponse {
  products?: ApiProduct[];
}

interface PlatformProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string | null;
  category: string;
  stock: number;
  totalSold: number;
}

async function fetchPlatformItems(): Promise<ShopItem[]> {
  try {
    const res = await fetch("/api/store/products");
    if (!res.ok) return [];
    const data = await res.json();
    const products = (data?.products ?? []) as PlatformProduct[];
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category || "Shop",
      price: p.price,
      currency: p.currency,
      stock: p.stock,
      description: p.description,
      icon: "shop" as const,
      image: p.image ?? undefined,
      totalSold: p.totalSold,
      source: "platform" as const,
    }));
  } catch {
    return [];
  }
}

export function useProducts() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const fetchProducts = useCallback(async () => {
    setError(false);
    try {
      const [res, platformItems] = await Promise.all([
        fetch("/api/cache/homepage"),
        fetchPlatformItems(),
      ]);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      const productsData = data?.products as ProductsApiResponse | null;
      const totalStock = (p: ApiProduct) =>
        p.variants?.length ? p.variants.reduce((s: number, v) => s + v.stock, 0) : p.stock;
      const minPrice = (p: ApiProduct) =>
        p.variants?.length ? Math.min(...p.variants.map((v) => v.price)) : p.price;
      const botItems: ShopItem[] = productsData?.products
        ? (productsData.products.map((p) => ({
            id: String(p.id),
            name: p.name,
            category: p.category || "Shop",
            price: minPrice(p),
            comparePrice: p.comparePrice,
            currency: p.currency ?? "EUR",
            stock: totalStock(p),
            description: p.description ?? "",
            icon: "shop" as const,
            image: p.images?.[0] || p.image,
            url: p.url,
            images: p.images,
            instructions: p.instructions,
            variants: p.variants,
            deliverableType: p.deliverableType as string,
            totalSold: p.totalSold,
            source: "bot" as const,
          })) as ShopItem[])
        : [];
      setItems([...platformItems, ...botItems]);
      if (!productsData?.products && platformItems.length === 0) setError(true);
    } catch {
      setError(true);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { items, loaded, error, refetch: fetchProducts };
}
