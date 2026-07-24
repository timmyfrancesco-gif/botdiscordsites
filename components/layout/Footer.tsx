"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Logo from "@/components/ui/Logo";
import { useLocale } from "@/lib/hooks/useLocale";
import { useSiteConfig } from "@/lib/contexts/SiteConfigContext";
import { safeExternalUrl } from "@/lib/safeUrl";

export default function Footer() {
  const { t } = useLocale();
  const site = useSiteConfig();

  return (
    <footer className="relative border-t border-border/60 bg-background-elevated/40 backdrop-blur-xl">
      <div className="footer-glow-line absolute inset-x-0 top-0" aria-hidden />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pb-14 pt-16 sm:px-6 lg:justify-between lg:flex-row lg:px-8 lg:pt-20"
      >
        {/* Brand */}
        <div className="max-w-xs shrink-0">
          <Link href={site.isTenant ? `/s/${site.tenantSlug}` : "/#top"} className="flex items-center gap-2 text-lg font-bold tracking-tight">
            {site.tenantLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={site.tenantLogo} alt="" className="h-8 w-8 rounded-full" />
            ) : (
              <Logo className="h-8 w-8" />
            )}
            <span>{site.name}</span>
          </Link>
          <p className="mt-2.5 text-sm leading-relaxed text-muted">
            {t("footer.description")}
          </p>
        </div>

        {/* Link groups */}
        <div className="flex flex-1 flex-wrap justify-between gap-8 sm:flex-nowrap lg:max-w-xl">
          {/* Navigation */}
          <div className="min-w-[45%] sm:min-w-[90px]">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted">
              {t("footer.navigation")}
            </h3>
            <ul className="mt-3 flex flex-col gap-2.5 text-sm text-muted">
              <li><Link href="/#top" className="footer-link">{t("nav.home")}</Link></li>
              <li><Link href="/#shop" className="footer-link">{t("nav.products")}</Link></li>
              <li><Link href="/#vouches" className="footer-link">{t("footer.feedback")}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="min-w-[45%] sm:min-w-[90px]">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted">
              {t("footer.legal")}
            </h3>
            <ul className="mt-3 flex flex-col gap-2.5 text-sm text-muted">
              <li><Link href="/terms" className="footer-link">{t("nav.terms")}</Link></li>
            </ul>
          </div>

          {/* Socials */}
          <div className="min-w-[45%] sm:min-w-[90px]">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted">
              {t("footer.socials")}
            </h3>
            <ul className="mt-3 flex flex-col gap-2.5 text-sm text-muted">
              <li>
                <a href={safeExternalUrl(site.discordInvite)} target="_blank" rel="noopener noreferrer" className="footer-link">
                  {t("socials.discord")}
                </a>
              </li>
              {site.telegramInvite && (
                <li>
                  <a href={safeExternalUrl(site.telegramInvite)} target="_blank" rel="noopener noreferrer" className="footer-link">
                    {t("socials.telegram")}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </motion.div>

      <div className="footer-bg-text" aria-hidden="true">
        <span>{site.name}</span>
      </div>
    </footer>
  );
}
