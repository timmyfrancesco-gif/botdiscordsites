"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import SafeHtml from "@/components/ui/SafeHtml";
import ServiceIcon from "@/components/ui/ServiceIcon";
import { useCart } from "@/lib/hooks/useCart";
import { useLocale } from "@/lib/hooks/useLocale";
import { useProducts } from "@/lib/hooks/useProducts";

function useViewerCount(productId: string) {
  const [count, setCount] = useState(0);
  const sessionId = useRef("");

  useEffect(() => {
    if (!productId) return;
    if (!sessionId.current) {
      sessionId.current =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Math.random()).slice(2);
    }

    let cancelled = false;

    async function ping() {
      try {
        const res = await fetch(`/api/products/${productId}/views`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sessionId.current }),
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setCount(data.viewers ?? 0);
        }
      } catch { /* ignore */ }
    }

    ping();
    const interval = setInterval(ping, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [productId]);

  return count;
}

function usePurchaseCount(productId: string, totalSold?: number) {
  const [count, setCount] = useState(totalSold ?? 0);

  const fetchCount = useCallback(async () => {
    if (totalSold !== undefined && totalSold > 0) {
      setCount(totalSold);
      return;
    }
    try {
      const res = await fetch("/api/cache/homepage");
      if (!res.ok) return;
      const data = await res.json();
      const items = data?.feed?.items;
      if (!Array.isArray(items)) return;
      const orderCount = items.filter(
        (f: { type: string; label: string }) =>
          f.type === "order" && f.label.toLowerCase().includes(productId.toLowerCase()),
      ).length;
      setCount(orderCount);
    } catch { /* ignore */ }
  }, [productId, totalSold]);

  useEffect(() => { fetchCount(); }, [fetchCount]);

  return count;
}

export default function ProductPage() {
  const { t, formatPrice } = useLocale();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { items, loaded, error } = useProducts();
  const cart = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"description" | "instructions">("description");

  const product = items.find((item) => String(item.id) === params.id);
  const viewers = useViewerCount(params.id ?? "");
  const purchases = usePurchaseCount(params.id ?? "", product?.totalSold);

  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const firstInStock = product.variants.findIndex((v) => v.stock > 0);
      if (firstInStock >= 0) setSelectedVariant(firstInStock);
    }
  }, [product]);

  if (!loaded) {
    return (
      <PageShell>
        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted">{t("product.loading")}</p>
        </section>
      </PageShell>
    );
  }

  if (error || !product) {
    return (
      <PageShell>
        <section className="px-4 py-24 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-foreground">
            {error ? t("product.errorTitle") : t("product.notFoundTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {error ? t("product.errorSubtitle") : t("product.notFoundSubtitle")}
          </p>
          <Link
            href="/#shop"
            className="mt-6 inline-block rounded-full border border-accent/30 bg-accent-soft px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-background"
          >
            {t("product.backToShop")}
          </Link>
        </section>
      </PageShell>
    );
  }

  const hasVariants = product.variants && product.variants.length > 0;
  const variant = hasVariants ? product.variants![selectedVariant] : null;
  const currentPrice = variant ? variant.price : product.price;
  const currentStock = variant ? variant.stock : product.stock;
  const maxQuantity = currentStock > 0 ? currentStock : 1;
  const total = currentPrice * quantity;

  const allImages = product.images?.length ? product.images : product.image ? [product.image] : [];

  function handleAddToCart() {
    if (variant) {
      cart.addItem(product!, quantity, variant.id, variant.title, variant.price);
    } else {
      cart.addItem(product!, quantity);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handlePurchaseNow() {
    const p = new URLSearchParams({
      productId: product!.id,
      qty: String(quantity),
    });
    if (variant) {
      p.set("variantId", variant.id);
    }
    router.push(`/checkout?${p.toString()}`);
  }

  return (
    <PageShell>
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link href="/#shop" className="inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-foreground">
            &larr; {t("product.backToShop")}
          </Link>

          <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1.35fr_1fr]">
            {/* Image gallery */}
            <div className="flex flex-col gap-3.5">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/[0.07] bg-[#0d0d0d]">
                {allImages.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={allImages[activeImage]}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-accent/40">
                    <ServiceIcon name={product.icon} className="h-24 w-24" />
                  </div>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      className={`aspect-video w-full overflow-hidden rounded-lg border bg-[#0d0d0d] transition-colors ${
                        activeImage === i
                          ? "border-accent/50"
                          : "border-white/[0.07] hover:border-accent/50"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Description / Instructions tabs */}
              {(product.description || product.instructions) && (
                <div className="flex flex-col gap-3.5">
                  {product.description && product.instructions ? (
                    <div className="flex w-fit max-w-full gap-2 overflow-x-auto">
                      <button
                        type="button"
                        onClick={() => setActiveTab("description")}
                        className={`shrink-0 whitespace-nowrap rounded-full border px-4.5 py-2 text-[13px] font-medium transition-colors ${
                          activeTab === "description"
                            ? "border-accent/35 bg-accent/[0.12] text-white"
                            : "border-white/[0.07] bg-[#0d0d0d] text-white/35 hover:text-white/70"
                        }`}
                      >
                        Description
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("instructions")}
                        className={`shrink-0 whitespace-nowrap rounded-full border px-4.5 py-2 text-[13px] font-medium transition-colors ${
                          activeTab === "instructions"
                            ? "border-accent/35 bg-accent/[0.12] text-white"
                            : "border-white/[0.07] bg-[#0d0d0d] text-white/35 hover:text-white/70"
                        }`}
                      >
                        {t("product.instructions") || "Instructions"}
                      </button>
                    </div>
                  ) : null}

                  <div className="rounded-xl border border-white/[0.07] bg-[#0d0d0d] p-5">
                    {(!product.instructions || activeTab === "description") && product.description ? (
                      product.description.includes("<") ? (
                        <SafeHtml
                          html={product.description}
                          className="prose prose-sm prose-invert max-w-none text-white/50"
                        />
                      ) : (
                        <p className="text-sm leading-relaxed text-white/50">{product.description}</p>
                      )
                    ) : null}
                    {(!product.description || activeTab === "instructions") && product.instructions ? (
                      <SafeHtml
                        html={product.instructions}
                        className="prose prose-sm prose-invert max-w-none text-white/50"
                      />
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col gap-3.5">
              {/* Title + trust badges card */}
              <div className="flex flex-col gap-4 rounded-xl border border-white/[0.07] bg-[#0d0d0d] p-6">
                <h1 className="text-[26px] font-bold leading-tight tracking-tight text-white sm:text-[32px]">
                  {product.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/[0.07] bg-white/[0.03] px-3.5 py-[7px] text-xs font-semibold text-white/60">
                    <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] shrink-0 text-[#fa8b90]" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Verified Quality
                  </span>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/[0.07] bg-white/[0.03] px-3.5 py-[7px] text-xs font-semibold text-white/60">
                    <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] shrink-0 text-[#fa8b90]" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Instant Delivery
                  </span>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/[0.07] bg-white/[0.03] px-3.5 py-[7px] text-xs font-semibold text-white/60">
                    <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] shrink-0 text-[#fa8b90]" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
                    </svg>
                    Secure Checkout
                  </span>
                </div>
              </div>

              {/* Price + Stock */}
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.07] bg-[#0d0d0d] p-6">
                <span className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-casino-from to-accent px-4 py-2.5 shadow-[0_14px_30px_rgba(237,58,65,0.3),inset_0_1px_0_rgba(255,255,255,0.35)]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-background" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="text-lg font-extrabold text-background">
                    {formatPrice(currentPrice)}
                  </span>
                </span>
                {product.comparePrice && product.comparePrice > currentPrice ? (
                  <span className="text-sm font-semibold text-white/40 line-through">
                    {formatPrice(product.comparePrice)}
                  </span>
                ) : null}
                <span
                  className={`pc-stock ${
                    currentStock <= 0 ? "pc-stock--out" : currentStock <= 5 ? "pc-stock--low" : "pc-stock--in"
                  }`}
                >
                  {currentStock <= 0
                    ? t("shop.outOfStock")
                    : currentStock <= 5
                      ? `${currentStock} ${t("shop.lowStockLeft")}`
                      : `${currentStock} ${t("shop.inStock")}`}
                </span>
              </div>

              {/* Variant selector */}
              {hasVariants && product.variants!.length > 1 && (
                <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0d0d0d]">
                  <div className="border-b border-white/[0.07] px-4 py-3">
                    <span className="text-sm font-semibold text-white">Variant</span>
                  </div>
                  <div className="divide-y divide-white/[0.06]">
                    {product.variants!.map((v, i) => {
                      const isSelected = selectedVariant === i;
                      const isOutOfStock = v.stock === 0;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setSelectedVariant(i);
                            setQuantity(1);
                          }}
                          className={`flex w-full items-center justify-between px-4 py-3.5 text-left transition-all ${
                            isSelected
                              ? "bg-accent/[0.08] border-l-2 border-l-accent"
                              : "hover:bg-white/[0.03] border-l-2 border-l-transparent"
                          }`}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className={`text-sm font-semibold ${isSelected ? "text-white" : "text-white/50"}`}>
                              {v.title}
                            </span>
                            {isOutOfStock && (
                              <span className="text-xs text-rose-400">Out of Stock</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${isSelected ? "text-accent" : "text-white"}`}>
                              {formatPrice(v.price)}
                            </span>
                            {isSelected && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-background">
                                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3}>
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity + buttons card */}
              <div className="flex flex-col gap-4 rounded-xl border border-white/[0.07] bg-[#0d0d0d] p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{t("product.quantity")}</span>
                  <div className="flex items-center gap-0 overflow-hidden rounded-full border border-white/[0.07] bg-white/[0.03]">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={currentStock === 0}
                      className="px-4 py-2 text-base font-bold text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-10 border-x border-white/[0.07] py-2 text-center text-sm font-semibold text-white">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                      disabled={currentStock === 0}
                      className="px-4 py-2 text-base font-bold text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={currentStock === 0}
                    className="hero-cta-primary flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold disabled:opacity-40"
                  >
                    {added ? `${t("product.added")} ✓` : t("product.addToCart")}
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l3-7H6.4M7 13L5.4 5M7 13l-1.5 3h11M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={handlePurchaseNow}
                    disabled={currentStock === 0}
                    className="hero-cta-secondary flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold disabled:opacity-40"
                  >
                    {currentStock === 0 ? t("product.outOfStock") : "Buy Now"}
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Social proof (live stats) */}
              {(viewers > 0 || purchases > 0) && (
                <div className="flex flex-col gap-2.5 rounded-xl border border-white/[0.07] bg-[#0d0d0d] p-5">
                  {viewers > 0 && (
                    <div className="flex items-center gap-2 text-xs text-white/35">
                      <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] shrink-0 text-[#fa8b90]" fill="none" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="3" />
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                      </svg>
                      <span><strong className="font-semibold text-white/80">{viewers}</strong> {viewers === 1 ? "person is" : "people are"} currently viewing</span>
                    </div>
                  )}
                  {purchases > 0 && (
                    <div className="flex items-center gap-2 text-xs text-white/35">
                      <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] shrink-0 text-[#fa8b90]" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <span><strong className="font-semibold text-white/80">{purchases}</strong> people have purchased.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
