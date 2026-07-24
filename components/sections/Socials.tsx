"use client";

import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import { useLocale } from "@/lib/hooks/useLocale";
import { useSiteConfig } from "@/lib/contexts/SiteConfigContext";
import { safeExternalUrl } from "@/lib/safeUrl";

function SocialCard({
  href,
  label,
  icon,
  index,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  index: number;
}) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-4 transition-all duration-300 hover:border-accent/30 hover:bg-white/[0.05]"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#301516] to-[#1f0d0e] text-[#fa8b90]">
          {icon}
        </div>
        <span className="text-base font-semibold text-foreground">{label}</span>
      </div>
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 shrink-0 text-muted transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
      </svg>
    </motion.a>
  );
}

export default function Socials() {
  const { t } = useLocale();
  const site = useSiteConfig();

  const discordHref = safeExternalUrl(site.discordInvite);
  const telegramHref = site.telegramInvite ? safeExternalUrl(site.telegramInvite) : null;

  return (
    <section id="community" className="relative px-4 py-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow={t("socials.eyebrow")}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 432" fill="currentColor" aria-hidden>
              <path d="M320 303q26 0 44 18.5t18 44t-18 44t-44 18.5t-44-18.5t-18-44.5q0-6 1-14l-151-88q-19 17-44 17q-27 0-45.5-18.5T0 216t18.5-45.5T64 152q25 0 44 17l150-87q-2-9-2-15q0-27 18.5-45.5T320 3t45.5 18.5t18.5 45t-18.5 45.5t-45.5 19q-25 0-44-18l-150 88q2 9 2 15t-2 15l152 88q18-16 42-16z" />
            </svg>
          }
          title={t("socials.title")}
          description={t("socials.description")}
        />

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SocialCard
            href={discordHref}
            label={t("socials.discord")}
            index={0}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z" />
              </svg>
            }
          />

          {telegramHref && (
            <SocialCard
              href={telegramHref}
              label={t("socials.telegram")}
              index={1}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" fill="currentColor" aria-hidden>
                  <path d="M236.88 26.19a9 9 0 0 0-9.16-1.57L25.06 103.93a14.22 14.22 0 0 0 2.43 27.21L80 141.45V200a15.92 15.92 0 0 0 10 14.83a15.91 15.91 0 0 0 17.51-3.73l25.32-26.26L173 220a15.88 15.88 0 0 0 10.51 4a16.3 16.3 0 0 0 5-.79a15.85 15.85 0 0 0 10.67-11.63L239.77 35a9 9 0 0 0-2.89-8.81Zm-61.14 36l-89.59 64.16l-49.6-9.73ZM96 200v-47.48l24.79 21.74Zm87.53 8l-82.68-72.5l119-85.29Z" />
                </svg>
              }
            />
          )}
        </div>
      </div>
    </section>
  );
}
