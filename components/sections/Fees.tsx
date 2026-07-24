"use client";

import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import { CRYPTO_TO_CRYPTO_FEES, PAYPAL_TO_CRYPTO_FEES } from "@/lib/config";
import { useLocale } from "@/lib/hooks/useLocale";

function FeeTable({
  title,
  rows,
  footnote,
  amountLabel,
  feeLabel,
  index,
}: {
  title: string;
  rows: { range: string; fee: string }[];
  footnote?: string;
  amountLabel: string;
  feeLabel: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="group shine-card overflow-hidden rounded-2xl border border-white/[0.07] bg-background-elevated p-7 transition-colors duration-300 hover:brightness-110"
    >
      <span className="shine-sweep" aria-hidden />
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <table className="mt-5 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-muted">
            <th className="pb-3 font-medium">{amountLabel}</th>
            <th className="pb-3 text-right font-medium">{feeLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.range} className="border-t border-white/[0.07] transition-colors hover:bg-accent/5">
              <td className="py-3 text-foreground">{row.range}</td>
              <td className="py-3 text-right font-bold text-accent">{row.fee}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {footnote ? <p className="mt-4 text-xs text-muted">{footnote}</p> : null}
    </motion.div>
  );
}

export default function Fees() {
  const { t } = useLocale();

  return (
    <section id="fees" className="section-glow relative px-4 py-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow={t("fees.eyebrow")}
          title={t("fees.title")}
          description={t("fees.description")}
        />

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FeeTable
            title={t("fees.paypalToCrypto")}
            rows={PAYPAL_TO_CRYPTO_FEES}
            amountLabel={t("fees.amount")}
            feeLabel={t("fees.fee")}
            index={0}
          />

          <FeeTable
            title={t("fees.cryptoToCrypto")}
            rows={CRYPTO_TO_CRYPTO_FEES}
            amountLabel={t("fees.amount")}
            feeLabel={t("fees.fee")}
            index={1}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="group shine-card relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-emerald-500/20 bg-background-elevated p-8 text-center transition-colors duration-300 hover:brightness-110"
          >
            <span className="shine-sweep" aria-hidden />
            <div className="ring-pulse-wrap mb-4 h-16 w-16">
              <span className="ring-pulse" style={{ borderColor: "rgb(52 211 153)" }} />
              <span className="ring-pulse" style={{ borderColor: "rgb(52 211 153)" }} />
              <span className="ring-pulse" style={{ borderColor: "rgb(52 211 153)" }} />
              <div className="relative z-[1] flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-bold text-foreground">{t("fees.cryptoToPaypal")}</h3>
            <p className="mt-3 text-4xl font-black text-emerald-400">{t("fees.free")}</p>
            <p className="mt-2 text-sm text-muted">{t("fees.noFee")}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="group shine-card grid grid-cols-2 gap-0 overflow-hidden rounded-2xl border border-white/[0.07] bg-background-elevated transition-colors duration-300 hover:brightness-110"
          >
            <span className="shine-sweep" aria-hidden />
            <div className="flex flex-col items-center justify-center p-8">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-foreground">{t("fees.escrow")}</h3>
              <p className="mt-2 text-3xl font-black text-accent">0.25%</p>
              <p className="mt-1 text-xs text-muted">{t("fees.flatFee")}</p>
            </div>
            <div className="flex flex-col items-center justify-center border-l border-white/[0.07] p-8">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12l2.5 2.5L16 9m-9 3l-3.5 3.5a2 2 0 102.83 2.83L9.5 15M16 9l3.5-3.5a2 2 0 10-2.83-2.83L13 6" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-foreground">{t("fees.middleman")}</h3>
              <p className="mt-2 text-3xl font-black text-accent">5%</p>
              <p className="mt-1 text-xs text-muted">{t("fees.splitFee")}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
