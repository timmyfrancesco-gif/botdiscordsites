"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { useLocale } from "@/lib/hooks/useLocale";
import { useSiteConfig } from "@/lib/contexts/SiteConfigContext";
import { safeExternalUrl } from "@/lib/safeUrl";
import StarfieldHero from "@/components/effects/StarfieldHero";

const STAT_ICONS: Record<string, React.ReactNode> = {
  star: (
    <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L10 14.9l-5.2 2.6.99-5.78-4.21-4.1 5.82-.85L10 1.5z" />
  ),
  bolt: <path d="M11 1L3 12h6l-2 11 10-13h-6l2-9z" />,
  chart: <path d="M3 17V9m5.5 8V3M14 17v-5m5.5 5V7" strokeLinecap="round" />,
  users: (
    <path
      d="M7 10a3 3 0 100-6 3 3 0 000 6zm10 0a3 3 0 100-6 3 3 0 000 6zM1 19c0-3 3-5 6-5s6 2 6 5M11 19c0-3 3-5 6-5s6 2 6 5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

/** Splits text into <span> words, each staggered by CSS animation-delay. */
function RevealWords({
  text,
  startDelay = 0,
  step = 0.045,
}: {
  text: string;
  startDelay?: number;
  step?: number;
}) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <span
          key={i}
          className="word-reveal"
          style={{ animationDelay: `${startDelay + i * step}s` }}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const { t } = useLocale();
  const site = useSiteConfig();

  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  const title = site.isTenant ? site.name : t("hero.title");
  const subtitle = site.isTenant && site.tagline ? site.tagline : t("hero.description");

  const STATS = [
    { label: t("hero.statRating"), value: "4.9", icon: "star" },
    { label: t("hero.statTrades"), value: "25K+", icon: "bolt" },
    { label: t("hero.statVolume"), value: "300K+", icon: "chart" },
    { label: t("hero.statTraders"), value: "5K+", icon: "users" },
  ];

  return (
    <section
      ref={ref}
      id="top"
      className="relative -mt-28 flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-4 pt-28 pb-16 text-center sm:px-6 lg:px-8"
    >
      <div className="hero-underglow" aria-hidden />
      <StarfieldHero className="z-[1]" />
      <div className="hero-overlay pointer-events-none absolute inset-0 z-[2]" aria-hidden />

      <motion.div style={{ opacity: contentOpacity, y: contentY }} className="relative z-10 flex flex-col items-center">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="hero-badge-pill mb-7"
        >
          {site.isTenant ? "Digital Shop" : t("hero.badge")}
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 15 15" fill="currentColor" aria-hidden>
            <path d="M8.293 2.293a1 1 0 0 1 1.414 0l4.5 4.5a1 1 0 0 1 0 1.414l-4.5 4.5a1 1 0 0 1-1.414-1.414L11 8.5H1.5a1 1 0 0 1 0-2H11L8.293 3.707a1 1 0 0 1 0-1.414Z" />
          </svg>
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-balance text-5xl font-extralight uppercase tracking-tight sm:text-7xl lg:text-8xl"
        >
          <span className="hero-title-gradient">{title}</span>
        </motion.h1>

        <p className="mt-6 max-w-2xl text-balance text-lg text-muted sm:text-xl">
          <RevealWords text={subtitle} startDelay={0.55} step={0.025} />
        </p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Link
            href={site.isTenant ? `/s/${site.tenantSlug}/#shop` : "/#shop"}
            className="hero-cta-primary inline-flex h-11 items-center justify-center gap-2 rounded-full px-7 text-sm font-medium"
          >
            {t("hero.cta1")}
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 15 15" fill="currentColor" aria-hidden>
              <path d="M8.293 2.293a1 1 0 0 1 1.414 0l4.5 4.5a1 1 0 0 1 0 1.414l-4.5 4.5a1 1 0 0 1-1.414-1.414L11 8.5H1.5a1 1 0 0 1 0-2H11L8.293 3.707a1 1 0 0 1 0-1.414Z" />
            </svg>
          </Link>
          {!site.isTenant && (
            <a
              href={safeExternalUrl(site.discordInvite)}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-cta-secondary inline-flex h-11 items-center justify-center gap-2 rounded-full px-7 text-sm font-medium"
            >
              {t("hero.ctaDiscord")}
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M20.3 4.5A18.5 18.5 0 0015.7 3l-.3.6a14 14 0 014.2 1.6 13.6 13.6 0 00-12.2 0A14 14 0 017.6 3.6L7.3 3a18.5 18.5 0 00-4.6 1.5C1 8 .5 11.4.7 14.8a13.8 13.8 0 004.1 2.1l.8-1.3a8.7 8.7 0 01-1.5-.7l.4-.3a11.7 11.7 0 009 0l.4.3a8.7 8.7 0 01-1.5.7l.8 1.3a13.8 13.8 0 004.1-2.1c.3-3.9-.6-7.3-1.9-10.3zM8.7 12.7c-.8 0-1.4-.7-1.4-1.6 0-.9.6-1.6 1.4-1.6.8 0 1.5.7 1.5 1.6 0 .9-.7 1.6-1.5 1.6zm6.6 0c-.8 0-1.4-.7-1.4-1.6 0-.9.6-1.6 1.4-1.6.9 0 1.5.7 1.5 1.6 0 .9-.6 1.6-1.5 1.6z" />
              </svg>
            </a>
          )}
        </motion.div>

        {!site.isTenant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.1 }}
            className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.15 + i * 0.08 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 text-center backdrop-blur-xl transition-colors hover:border-accent/50"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="mx-auto mb-2 h-5 w-5 text-accent"
                  fill={stat.icon === "star" || stat.icon === "bolt" ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  {STAT_ICONS[stat.icon]}
                </svg>
                <div className="text-xl font-bold text-foreground sm:text-2xl">{stat.value}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
