"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { SITE } from "@/lib/config";
import { useLocale } from "@/lib/hooks/useLocale";

export default function CtaSection() {
  const { t } = useLocale();
  const ref = useRef<HTMLElement>(null);

  return (
    <section ref={ref} className="px-4 pb-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-background-elevated px-6 py-20 text-center transition-colors duration-300 hover:brightness-110 sm:px-16"
        >
          <h2 className="text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            {t("cta.title").replace("{siteName}", SITE.name)}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-muted">
            {t("cta.description").replace(/\{siteName\}/g, SITE.name)}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={SITE.discordInvite}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-cta-primary inline-flex h-11 items-center justify-center gap-2 rounded-full px-8 text-sm font-medium"
            >
              {t("cta.joinDiscord")}
            </a>
            <Link
              href="/#shop"
              className="hero-cta-secondary inline-flex h-11 items-center justify-center gap-2 rounded-full px-8 text-sm font-medium"
            >
              {t("cta.visitShop")}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
