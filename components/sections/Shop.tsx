"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import SectionHeading from "@/components/ui/SectionHeading";
import ServiceIcon from "@/components/ui/ServiceIcon";
import CartDrawer from "@/components/shop/CartDrawer";
import { useCart } from "@/lib/hooks/useCart";
import { useProducts } from "@/lib/hooks/useProducts";
import { useLocale } from "@/lib/hooks/useLocale";

type SortOption = "default" | "price-asc" | "price-desc" | "name";

function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
        Out of Stock
      </span>
    );
  }
  if (stock <= 5) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-400">
        <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
        {stock} Left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      In Stock
    </span>
  );
}

export default function Shop() {
  const { items, loaded, error } = useProducts();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<SortOption>("default");
  const [cartOpen, setCartOpen] = useState(false);
  const { t, formatPrice } = useLocale();

  const cart = useCart();

  const SORT_OPTIONS: { id: SortOption; label: string }[] = [
    { id: "default", label: t("shop.sortFeatured") },
    { id: "price-asc", label: t("shop.sortPriceLow") },
    { id: "price-desc", label: t("shop.sortPriceHigh") },
    { id: "name", label: t("shop.sortName") },
  ];

  const categories = useMemo(() => {
    const unique = Array.from(new Set(items.map((item) => item.category)));
    return ["All", ...unique];
  }, [items]);

  const visibleItems = useMemo(() => {
    let result = items;

    if (category !== "All") {
      result = result.filter((item) => item.category === category);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
      );
    }

    const sorted = [...result];
    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return sorted;
  }, [items, category, search, sort]);

  return (
    <section id="shop" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            align="left"
            eyebrow={t("shop.eyebrow")}
            title={t("shop.title")}
            description={t("shop.description")}
          />

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative flex shrink-0 items-center gap-2 self-start rounded-full border border-border bg-background/60 px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent sm:self-auto"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l3-7H6.4M7 13L5.4 5M7 13l-1.5 3h11M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"
              />
            </svg>
            {t("shop.cart")}
            {cart.count > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-background">
                {cart.count}
              </span>
            ) : null}
          </button>
        </div>

        {/* Category Tabs */}
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                  category === c
                    ? "border-accent bg-accent text-background shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                    : "border-border bg-background/60 text-muted hover:border-accent/50 hover:text-foreground"
                }`}
              >
                {c === "All" ? t("shop.eyebrow").includes("All") ? c : "All Products" : c}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M21 21l-3.5-3.5" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("shop.searchPlaceholder")}
                className="w-full rounded-full border border-border bg-background/60 py-2 pl-9 pr-4 text-sm text-foreground outline-none transition-colors focus:border-accent sm:w-56"
              />
            </div>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="rounded-full border border-border bg-background/60 px-4 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {!loaded ? (
          <p className="mt-14 text-center text-sm text-muted">{t("shop.loadingProducts")}</p>
        ) : error ? (
          <p className="mt-14 text-center text-sm text-muted">
            {t("shop.errorProducts")}
          </p>
        ) : visibleItems.length === 0 ? (
          <p className="mt-14 text-center text-sm text-muted">
            {t("shop.noProducts")}
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {visibleItems.map((item, i) => {
              const inStock = item.stock > 0;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
                  whileHover={{ y: -4 }}
                  className="group relative flex flex-col overflow-hidden rounded-2xl"
                >
                  {/* Gradient border glow effect */}
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-accent/30 via-border to-border opacity-100 transition-opacity group-hover:from-accent/50 group-hover:via-accent/20" />
                  <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl bg-background-elevated">
                    {/* Banner / Header */}
                    <Link
                      href={`/products/${item.id}`}
                      className="relative block h-36 w-full overflow-hidden"
                    >
                      {item.image ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background-elevated via-background-elevated/60 to-transparent" />
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-background-elevated to-casino-from/10" />
                      )}

                      {/* Product name overlay on banner */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                        <span className="text-sm font-bold text-accent drop-shadow-lg">
                          {item.category}
                        </span>
                        <h3 className="mt-1 text-lg font-extrabold text-foreground drop-shadow-lg">
                          {item.name}
                        </h3>
                      </div>

                      {/* Top-right glow on hover */}
                      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-accent/20 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    </Link>

                    {/* Card body */}
                    <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
                      {/* Brand badge */}
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10 text-accent">
                          <ServiceIcon name={item.icon} className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-medium text-muted">Lukus</span>
                      </div>

                      {/* Product name + stock */}
                      <h4 className="text-sm font-semibold text-foreground">{item.name}</h4>
                      <div className="mt-2">
                        <StockBadge stock={item.stock} />
                      </div>

                      {/* Price */}
                      <div className="mt-3">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                          Price
                        </span>
                        <p className="mt-0.5 text-lg font-bold text-foreground">
                          {formatPrice(item.price)}
                        </p>
                      </div>

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Action buttons */}
                      <div className="mt-4 flex flex-col gap-2">
                        {inStock ? (
                          <>
                            <button
                              type="button"
                              onClick={() => cart.addItem(item, 1)}
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-background transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:brightness-110"
                            >
                              Purchase Now
                              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638l-3.96-3.96a.75.75 0 111.06-1.06l5.25 5.25a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 11-1.06-1.06l3.96-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <Link
                              href={`/products/${item.id}`}
                              className="flex w-full items-center justify-center rounded-xl border border-border bg-transparent px-4 py-2 text-xs font-semibold text-muted transition-colors hover:border-accent/50 hover:text-foreground"
                            >
                              {t("shop.viewDetails")}
                            </Link>
                          </>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="flex w-full cursor-not-allowed items-center justify-center rounded-xl border border-border bg-background/40 px-4 py-2.5 text-sm font-semibold text-muted"
                          >
                            {t("shop.outOfStock")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <CartDrawer
        open={cartOpen}
        lines={cart.lines}
        total={cart.total}
        currency={cart.currency}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={cart.updateQuantity}
        onRemove={cart.removeItem}
        onClear={cart.clear}
      />
    </section>
  );
}
