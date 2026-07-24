"use client";

import { motion } from "framer-motion";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import { formatEur } from "@/lib/format";

interface Vouch {
  id: string;
  buyerId: string;
  buyerName: string | null;
  buyerAvatarUrl: string | null;
  sellerId: string;
  sellerName: string | null;
  quantity: number;
  product: string;
  price: number;
  method: string;
  postedAt: string | null;
  createdAt: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

function VouchCard({ vouch, index }: { vouch: Vouch; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: (index % 6) * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col gap-3.5 rounded-xl border border-white/[0.07] bg-background-elevated p-5 transition-colors duration-300 hover:brightness-110"
    >
      <div className="flex items-center gap-3">
        {vouch.buyerAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vouch.buyerAvatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
            {(vouch.buyerName ?? "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{vouch.buyerName ?? "Unknown buyer"}</p>
          <p className="text-[11px] text-white/45">{formatDate(vouch.postedAt ?? vouch.createdAt)}</p>
        </div>
      </div>

      <p className="text-[13px] leading-relaxed text-white/70">
        vouched for <span className="font-medium text-foreground">{vouch.sellerName ?? vouch.sellerId}</span>
      </p>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-white/60">
          {vouch.quantity}x {vouch.product}
        </span>
        <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 font-semibold text-accent">
          {formatEur(vouch.price)} · {vouch.method}
        </span>
      </div>

      <div className="mt-1 flex items-center gap-1.5 border-t border-white/[0.05] pt-3">
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-emerald-400" fill="currentColor" aria-hidden>
          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
        </svg>
        <span className="text-[11px] font-medium text-white/55">Verified Purchase</span>
      </div>
    </motion.div>
  );
}

function VouchesContent() {
  const searchParams = useSearchParams();
  const sellerId = searchParams.get("seller");

  const [vouches, setVouches] = useState<Vouch[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    const url = sellerId ? `/api/vouches?sellerId=${encodeURIComponent(sellerId)}` : "/api/vouches";
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.vouches) setVouches(d.vouches);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [sellerId]);

  const sellerLabel = vouches[0]?.sellerName ?? sellerId;

  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="eyebrow-badge">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L10 14.9l-5.2 2.6.99-5.78-4.21-4.1 5.82-.85L10 1.5z" />
            </svg>
            Reviews
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Vouches</h1>
          <p className="max-w-xl text-balance text-sm text-muted sm:text-base">
            {sellerId
              ? `Verified purchases vouched for ${sellerLabel ?? "this seller"} in our Discord server.`
              : "Verified purchases vouched for by buyers in our Discord server."}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {!loaded ? (
            <p className="col-span-full text-center text-sm text-muted">Loading…</p>
          ) : vouches.length === 0 ? (
            <p className="col-span-full text-center text-sm text-muted">No vouches yet.</p>
          ) : (
            vouches.map((v, i) => <VouchCard key={v.id} vouch={v} index={i} />)
          )}
        </div>
      </div>
    </section>
  );
}

export default function VouchesPage() {
  return (
    <PageShell>
      <Suspense fallback={<div className="px-4 py-24 text-center text-sm text-muted sm:px-6 lg:px-8">Loading…</div>}>
        <VouchesContent />
      </Suspense>
    </PageShell>
  );
}
