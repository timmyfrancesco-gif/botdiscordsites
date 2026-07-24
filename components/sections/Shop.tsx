"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import SectionHeading from "@/components/ui/SectionHeading";
import ServiceIcon from "@/components/ui/ServiceIcon";
import CartDrawer from "@/components/shop/CartDrawer";
import { useCart } from "@/lib/hooks/useCart";
import { useLocale } from "@/lib/hooks/useLocale";
import { useHomepageData } from "@/lib/contexts/HomepageDataContext";
import type { ShopItem } from "@/lib/types";
import { useSiteConfig } from "@/lib/contexts/SiteConfigContext";
import { useSpotlight } from "@/lib/hooks/useSpotlight";

type SortOption = "default" | "price-asc" | "price-desc" | "name";

function ProductCard({
  item,
  index,
  isBestSeller,
  t,
  formatPrice,
  isTenant,
  tenantSlug,
}: {
  item: ShopItem;
  index: number;
  isBestSeller: boolean;
  t: (k: string) => string;
  formatPrice: (n: number) => string;
  isTenant: boolean;
  tenantSlug?: string;
}) {
  const { ref: spotlightRef, onMouseMove, onMouseLeave } = useSpotlight<HTMLDivElement>();

  const isRange = (() => {
    if (!item.variants || item.variants.length <= 1) return false;
    const prices = item.variants.map((v) => v.price);
    return Math.min(...prices) !== Math.max(...prices);
  })();
  const displayPrice = item.variants && item.variants.length > 1
    ? (() => {
        const prices = item.variants.map((v) => v.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`;
      })()
    : formatPrice(item.price);

  const cardInner = (
    <motion.div
      ref={spotlightRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: (index % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={`group shine-card spotlight relative flex flex-col overflow-hidden bg-[#0d0d0d] transition-colors duration-300 hover:bg-[#111111] ${
        isBestSeller
          ? "rounded-[calc(1rem-1px)] border-0"
          : "rounded-2xl border border-white/[0.07] hover:border-accent/30"
      }`}
    >
      <span className="spotlight-glow" aria-hidden />
      <span className="shine-sweep" aria-hidden />
      <Link
        href={isTenant ? `/s/${tenantSlug}/products/${item.id}` : `/products/${item.id}`}
        className="relative aspect-[4/3] w-full overflow-hidden bg-background-elevated"
      >
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/10 to-background-elevated text-accent">
            <ServiceIcon name={item.icon} className="h-16 w-16" />
          </div>
        )}

        {/* Hover overlay with View Details */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
          <span className="rounded-xl bg-gradient-to-r from-casino-from to-casino-to px-8 py-3 text-sm font-bold text-white shadow-xl transition-transform duration-300 group-hover:scale-100 scale-90">
            {t("shop.viewDetails")}
          </span>
        </div>
      </Link>

      <div className="relative z-[2] flex flex-1 flex-col gap-3.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 truncate text-base font-bold text-foreground">{item.name}</h3>
          <span
            className={`pc-stock shrink-0 ${
              item.stock <= 0 ? "pc-stock--out" : item.stock <= 5 ? "pc-stock--low" : "pc-stock--in"
            }`}
          >
            {item.stock <= 0
              ? t("shop.outOfStock")
              : item.stock <= 5
                ? `${item.stock} ${t("shop.lowStockLeft")}`
                : `${item.stock} ${t("shop.inStock")}`}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2.5">
          <span className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-accent/30 bg-accent/[0.15] px-3.5 py-2.5 text-[13px] font-medium text-[#ffadb0] transition-all duration-200 group-hover:border-accent/55 group-hover:bg-accent/[0.28] group-hover:text-white">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 opacity-70" fill="currentColor">
              <path d="M7 22q-.825 0-1.412-.587T5 20t.588-1.412T7 18t1.413.588T9 20t-.587 1.413T7 22m10 0q-.825 0-1.412-.587T15 20t.588-1.412T17 18t1.413.588T19 20t-.587 1.413T17 22M6.15 6l2.4 5h7l2.75-5zM5.2 4h14.75q.575 0 .875.513t.025 1.037l-3.55 6.4q-.275.5-.737.775T15.55 13H8.1L7 15h11q.425 0 .713.288T19 16t-.288.713T18 17H7q-1.125 0-1.7-.987t-.05-1.963L6.6 11.6L3 4H2q-.425 0-.712-.288T1 3t.288-.712T2 2h1.625q.275 0 .525.15t.375.425zm3.35 7h7z" />
            </svg>
            {t("shop.buyNow")}
          </span>
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <span className="text-[10px] font-medium text-muted/70">{t("shop.startingAt")}</span>
            <span className="flex items-baseline gap-1.5 text-lg font-bold text-foreground">
              {displayPrice}
              {!isRange && item.comparePrice && item.comparePrice > item.price ? (
                <span className="text-xs font-normal text-muted/60 line-through">
                  {formatPrice(item.comparePrice)}
                </span>
              ) : null}
            </span>
          </div>
        </div>
      </div>

      {/* Best seller badge */}
      {isBestSeller && (
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-casino-from px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
            <path d="M10 1.5l3 5.5h6l-4.5 4 1.5 6-5-3.5-5 3.5 1.5-6L3 7h6l1-5.5z" />
          </svg>
          Best Seller
        </div>
      )}
    </motion.div>
  );

  // Wrap best-seller in a gradient border container (same effect as Pricing MOST VISIBILITY).
  if (isBestSeller) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-accent via-casino-from to-casino-to p-[1px] shadow-[0_0_40px_-10px_var(--accent)] transition-shadow duration-300 hover:shadow-[0_0_60px_-10px_var(--accent)]">
        {cardInner}
      </div>
    );
  }
  return cardInner;
}

export default function Shop() {
  const { shopItems: items, loaded, products: productsRes, feed } = useHomepageData();
  const error = loaded && !productsRes;
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<SortOption>("default");
  const [cartOpen, setCartOpen] = useState(false);
  const { t, formatPrice } = useLocale();

  const cart = useCart();
  const site = useSiteConfig();

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

  // Find best-selling product: prefer totalSold from API, fall back to feed order count.
  const bestSellerId = useMemo(() => {
    if (items.length === 0) return null;

    // If any product has totalSold from the API, use that.
    const withSold = items.filter((it) => (it.totalSold ?? 0) > 0);
    if (withSold.length > 0) {
      const top = withSold.reduce((best, it) => (it.totalSold! > best.totalSold! ? it : best));
      return top.id;
    }

    // Fall back to counting order events in the feed.
    if (feed.length === 0) return null;
    const counts = new Map<string, number>();
    for (const f of feed) {
      if (f.type !== "order") continue;
      const label = f.label.toLowerCase();
      for (const it of items) {
        if (label.includes(it.name.toLowerCase())) {
          counts.set(it.id, (counts.get(it.id) ?? 0) + 1);
        }
      }
    }
    if (counts.size === 0) return null;
    let topId = "";
    let topCount = 0;
    for (const [id, c] of counts) {
      if (c > topCount) { topId = id; topCount = c; }
    }
    return topId || null;
  }, [items, feed]);

  return (
    <section id="shop" className="section-glow relative px-4 py-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            align="left"
            eyebrow={t("shop.eyebrow")}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8.99911 1C11.2082 1 12.9991 2.79086 12.9991 5V6.02637C13.5582 6.05809 13.9564 6.1285 14.3018 6.29395C14.8429 6.55314 15.2933 6.96925 15.5958 7.4873C15.9394 8.07568 16.0034 8.85279 16.1309 10.4072L16.4434 14.2246C16.478 14.1567 16.5001 14.0814 16.5001 14C16.5001 13.1717 17.1718 12.5002 18.0001 12.5C18.8284 12.5001 19.5001 13.1716 19.5001 14C19.5001 15.6969 18.2923 17.1104 16.6895 17.4307C16.7252 18.2299 16.6862 18.761 16.4903 19.207C16.222 19.8176 15.7577 20.3214 15.171 20.6387C14.5031 20.9999 13.5988 21 11.7901 21H6.21005C4.40141 21 3.49706 20.9999 2.82919 20.6387C2.24251 20.3213 1.77821 19.8177 1.50985 19.207C1.20446 18.5119 1.27797 17.6101 1.42587 15.8076L1.86923 10.4072C1.99677 8.85282 2.06082 8.07567 2.40438 7.4873C2.70696 6.96917 3.15816 6.55313 3.69931 6.29395C4.0442 6.12886 4.44138 6.05814 4.99911 6.02637V5C4.99911 2.79113 6.79034 1.00044 8.99911 1ZM8.99911 3C7.89491 3.00044 6.99911 3.8957 6.99911 5V6H10.9991V5C10.9991 3.89543 10.1037 3 8.99911 3Z" />
              </svg>
            }
            title={t("shop.title")}
            description={t("shop.description")}
          />

          <motion.button
            type="button"
            onClick={() => setCartOpen(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="relative flex shrink-0 items-center gap-2 self-start rounded-full border border-border bg-background/60 px-4 py-2.5 text-sm font-semibold text-foreground transition-all duration-300 hover:border-accent hover:text-accent hover:shadow-[0_0_24px_-8px_var(--accent)] sm:self-auto"
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
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-300 ${
                  category === c
                    ? "border-accent bg-accent text-background shadow-[0_0_20px_-6px_var(--accent)]"
                    : "border-border bg-background/60 text-muted hover:border-accent/50 hover:text-foreground hover:shadow-[0_0_16px_-8px_var(--accent)]"
                }`}
              >
                {c}
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
        </motion.div>

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
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleItems.map((item, i) => (
              <ProductCard
                key={item.id}
                item={item}
                index={i}
                isBestSeller={item.id === bestSellerId}
                t={t}
                formatPrice={formatPrice}
                isTenant={site.isTenant}
                tenantSlug={site.tenantSlug}
              />
            ))}
          </div>
        )}
      </div>

      <CartDrawer
        open={cartOpen}
        lines={cart.lines}
        total={cart.total}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={cart.updateQuantity}
        onRemove={cart.removeItem}
        onClear={cart.clear}
      />
    </section>
  );
}
