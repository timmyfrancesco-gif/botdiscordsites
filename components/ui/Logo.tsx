"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";

const STOREFRONT_CONFIG_KEY = "hm_storefront_config";

function FallbackLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none">
      <rect width="40" height="40" rx="10" fill="currentColor" opacity="0.15" />
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="18" fontWeight="bold" fill="currentColor">
        HM
      </text>
    </svg>
  );
}

export default function Logo({ className }: { className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STOREFRONT_CONFIG_KEY);
      if (raw) {
        const config = JSON.parse(raw);
        if (config.logoUrl) {
          setSrc(config.logoUrl);
          return;
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  if (!src || errored) {
    return <FallbackLogo className={className} />;
  }

  return <img src={src} alt="Easy Boost" className={className} onError={() => setErrored(true)} />;
}
