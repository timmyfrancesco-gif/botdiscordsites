"use client";

import { useEffect, useRef, useState } from "react";
import { getProductOrder } from "@/lib/api";
import type { ProductOrderResponse } from "@/lib/types";

const POLL_INTERVAL_MS = 6000;

export default function PaypalPayment({
  order,
  email,
  onPaid,
  onCancelled,
}: {
  order: ProductOrderResponse;
  email: string;
  onPaid: (deliveredItem?: string | null) => void;
  onCancelled: () => void;
}) {
  const [phase, setPhase] = useState<"waiting" | "done">("waiting");
  const [copied, setCopied] = useState<string | null>(null);
  const onPaidRef = useRef(onPaid);
  const onCancelledRef = useRef(onCancelled);
  onPaidRef.current = onPaid;
  onCancelledRef.current = onCancelled;

  useEffect(() => {
    let cancelled = false;
    const interval = setInterval(async () => {
      const statusRes = await getProductOrder(order.orderId);
      if (cancelled || !statusRes) return;
      if (statusRes.status === "paid") {
        setPhase("done");
        clearInterval(interval);
        onPaidRef.current(statusRes.deliveredItem);
      } else if (statusRes.status === "cancelled") {
        clearInterval(interval);
        onCancelledRef.current();
      }
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [order.orderId]);

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground">Payment received!</h2>
        <p className="text-sm text-muted">
          A confirmation was sent to <strong>{email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold text-foreground">Pay with PayPal</h2>
        <p className="mt-1 text-sm text-muted">
          Follow the steps below exactly. This page updates automatically once the
          payment is confirmed.
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Amount</p>
        <p className="mt-1 text-2xl font-bold text-foreground">
          €{order.amountEur.toFixed(2)}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          Send to (PayPal email)
        </p>
        <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2">
          <span className="flex-1 break-all font-mono text-sm text-foreground">
            {order.paypalEmail}
          </span>
          <button
            type="button"
            onClick={() => copy(order.paypalEmail ?? "", "email")}
            className="shrink-0 text-xs font-semibold text-accent transition-opacity hover:opacity-80"
          >
            {copied === "email" ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          Payment note (required)
        </p>
        <div className="mt-1 flex items-center gap-2 rounded-xl border border-accent/40 bg-accent-soft px-3 py-2">
          <span className="flex-1 font-mono text-lg font-bold tracking-wider text-accent">
            {order.paypalNote}
          </span>
          <button
            type="button"
            onClick={() => copy(order.paypalNote ?? "", "note")}
            className="shrink-0 text-xs font-semibold text-accent transition-opacity hover:opacity-80"
          >
            {copied === "note" ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">Important</p>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-xs text-muted">
          <li>Send as <strong className="text-foreground">Friends &amp; Family</strong> — NOT Goods &amp; Services.</li>
          <li>Put the code <strong className="text-foreground">{order.paypalNote}</strong> in the payment note.</li>
          <li>Send exactly <strong className="text-foreground">€{order.amountEur.toFixed(2)}</strong>.</li>
          <li>Payments without the code or with a wrong amount can&apos;t be matched automatically.</li>
        </ul>
      </div>

      <a
        href="https://www.paypal.com/myaccount/transfer/homepage/pay"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-accent py-3 text-center text-sm font-semibold text-background transition-opacity hover:opacity-90"
      >
        Open PayPal
      </a>

      <div className="flex items-center justify-center gap-2 text-sm text-muted">
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
        Waiting for payment confirmation…
      </div>
    </div>
  );
}
