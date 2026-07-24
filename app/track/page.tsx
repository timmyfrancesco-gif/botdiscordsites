"use client";

import { useState } from "react";
import PageShell from "@/components/layout/PageShell";
import { getProductOrder } from "@/lib/api";
import { useLocale } from "@/lib/hooks/useLocale";
import type { ProductOrderStatusResponse } from "@/lib/types";

export default function TrackOrderPage() {
  const { t, formatPrice } = useLocale();
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProductOrderStatusResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!orderId.trim()) {
      setError(t("track.enterOrderId"));
      return;
    }

    setLoading(true);
    const res = await getProductOrder(orderId.trim());
    setLoading(false);

    if (!res) {
      setError(t("track.notFound"));
      return;
    }

    setResult(res);
  }

  const isPaid = result?.status === "paid";

  return (
    <PageShell>
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="eyebrow-badge">
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
              Order lookup
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {t("track.title")}
            </h1>
            <p className="max-w-md text-balance text-sm text-muted sm:text-base">
              {t("track.subtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-[#0d0d0d] p-6 sm:p-7">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">{t("track.orderIdLabel")}</span>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder={t("track.placeholder")}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 font-mono text-foreground outline-none transition-colors focus:border-accent"
              />
            </label>

            {error ? <p className="text-sm text-rose-400">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="hero-cta-primary inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-medium disabled:opacity-50"
            >
              {loading ? t("track.checking") : t("track.track")}
            </button>
          </form>

          {result ? (
            <div className="mt-6 rounded-2xl border border-white/[0.07] bg-[#0d0d0d] p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">{t("track.status")}</span>
                <span className={`pc-stock ${isPaid ? "pc-stock--in" : "pc-stock--low"} gap-1.5`}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
                  </span>
                  {isPaid ? t("track.paidDelivered") : t("track.awaitingPayment")}
                </span>
              </div>

              {result.orderId ? (
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted">{t("track.orderIdLabel")}</span>
                  <span className="font-mono text-foreground">{result.orderId}</span>
                </div>
              ) : null}

              {result.amountEur !== undefined ? (
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted">{t("track.amount")}</span>
                  <span className="font-semibold text-foreground">{formatPrice(result.amountEur)}</span>
                </div>
              ) : null}

              {result.address ? (
                <div className="mt-3 flex flex-col gap-1 text-sm">
                  <span className="text-muted">{t("track.ltcAddress")}</span>
                  <span className="break-all rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-foreground">
                    {result.address}
                  </span>
                </div>
              ) : null}

              {isPaid ? (
                <p className="mt-4 text-sm text-muted">
                  {t("track.deliveredMessage")}
                </p>
              ) : (
                <p className="mt-4 text-sm text-muted">
                  {t("track.pendingMessage")}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </section>
    </PageShell>
  );
}
