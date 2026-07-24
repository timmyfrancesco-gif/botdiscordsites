"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import LocaleSelector from "@/components/ui/LocaleSelector";
import CartDrawer from "@/components/shop/CartDrawer";
import { useAuth } from "@/lib/hooks/useAuth";
import { useLocale } from "@/lib/hooks/useLocale";
import { useSiteConfig } from "@/lib/contexts/SiteConfigContext";
import { useCart } from "@/lib/hooks/useCart";
import { safeExternalUrl } from "@/lib/safeUrl";

// UI-only: which accounts see the Dashboard link in their profile menu.
// The actual access check (/api/admin/unlock) is server-side and uses its
// own OWNER_EMAILS var — this is just so the owner doesn't have to know the
// dashboard URL by heart.
const OWNER_EMAILS = (process.env.NEXT_PUBLIC_OWNER_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const NAV_KEYS = [
  { href: "/#top", key: "nav.home", tenantVisible: true },
  { href: "/#shop", key: "nav.products", tenantVisible: true },
  { href: "/#vouches", key: "nav.reviews", tenantVisible: false },
  { href: "/terms", key: "nav.terms", tenantVisible: false },
];

const DOCK_THRESHOLD = 24;

function DiscordIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M20.3 4.5A18.5 18.5 0 0015.7 3l-.3.6a14 14 0 014.2 1.6 13.6 13.6 0 00-12.2 0A14 14 0 017.6 3.6L7.3 3a18.5 18.5 0 00-4.6 1.5C1 8 .5 11.4.7 14.8a13.8 13.8 0 004.1 2.1l.8-1.3a8.7 8.7 0 01-1.5-.7l.4-.3a11.7 11.7 0 009 0l.4.3a8.7 8.7 0 01-1.5.7l.8 1.3a13.8 13.8 0 004.1-2.1c.3-3.9-.6-7.3-1.9-10.3zM8.7 12.7c-.8 0-1.4-.7-1.4-1.6 0-.9.6-1.6 1.4-1.6.8 0 1.5.7 1.5 1.6 0 .9-.7 1.6-1.5 1.6zm6.6 0c-.8 0-1.4-.7-1.4-1.6 0-.9.6-1.6 1.4-1.6.9 0 1.5.7 1.5 1.6 0 .9-.6 1.6-1.5 1.6z" />
    </svg>
  );
}

function CartButton() {
  const cart = useCart();
  const { t } = useLocale();

  return (
    <button
      type="button"
      onClick={cart.openCart}
      aria-label={t("shop.cart")}
      className="island-nav-icon-btn relative"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3h2l.4 2M7 13h10l3-7H6.4M7 13L5.4 5M7 13l-1.5 3h11M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"
        />
      </svg>
      {cart.count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
          {cart.count > 9 ? "9+" : cart.count}
        </span>
      ) : null}
    </button>
  );
}

function UserMenu({ variant = "desktop" }: { variant?: "desktop" | "island" }) {
  const { t } = useLocale();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) {
    return (
      <Link
        href="/login"
        className={
          variant === "island"
            ? "island-nav-cta"
            : "flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
        }
      >
        {t("auth.login")}
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-sm font-medium text-white/80 transition-colors hover:border-accent/50 hover:text-white"
      >
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar}
            alt=""
            className="h-6 w-6 rounded-full"
          />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="max-w-[100px] truncate">{user.username}</span>
        <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-background shadow-xl z-50">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground truncate">{user.username}</p>
            <p className="text-xs text-muted truncate">{user.email}</p>
          </div>
          <div className="py-1">
            {(user.role === "admin" || (user.email && OWNER_EMAILS.includes(user.email.toLowerCase()))) && (
              <Link
                href="/dashboard-hm2025"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-accent hover:bg-background-elevated transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
                Dashboard
              </Link>
            )}
            <Link
              href="/track"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-background-elevated transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
              </svg>
              {t("auth.myOrders")}
            </Link>
            <button
              type="button"
              onClick={() => { logout(); setOpen(false); }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-background-elevated transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {t("auth.logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [docked, setDocked] = useState(false);
  const { t } = useLocale();
  const { user, logout } = useAuth();
  const site = useSiteConfig();
  const cart = useCart();
  const isOwner = Boolean(
    user && (user.role === "admin" || (user.email && OWNER_EMAILS.includes(user.email.toLowerCase())))
  );

  useEffect(() => {
    function onScroll() {
      setDocked(window.scrollY > DOCK_THRESHOLD);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const navLinks = NAV_KEYS.filter((l) => !site.isTenant || l.tenantVisible);
  const resolveHref = (href: string) =>
    site.isTenant && href.startsWith("/#") ? `/s/${site.tenantSlug}${href}` : href;

  return (
    <>
      {!site.isTenant && site.bannerEnabled && site.bannerText?.trim() ? (
        <div className="fixed inset-x-0 top-0 z-[60] bg-accent px-4 py-2 text-center text-sm font-semibold text-background">
          {site.bannerText}
        </div>
      ) : null}

      <header className={`island-nav ${docked ? "is-docked" : ""}`}>
        <div className="island-nav-pill">
          <nav className="island-nav-row">
            {/* Brand */}
            <div className="flex flex-1 items-center justify-start">
              <Link
                href={site.isTenant ? `/s/${site.tenantSlug}` : "/#top"}
                className="nb-brand flex shrink-0 items-center gap-2 text-base font-bold tracking-tight whitespace-nowrap text-white"
              >
                {site.tenantLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={site.tenantLogo} alt="" className="h-7 w-7 rounded-full" />
                ) : (
                  <Logo className="h-7 w-7" />
                )}
                <span>{site.name}</span>
              </Link>
            </div>

            {/* Center links (desktop) */}
            <div className="nb-links hidden flex-none items-center gap-0.5 px-6 lg:flex">
              {navLinks.map((link) => (
                <Link key={link.href} href={resolveHref(link.href)} className="island-nav-link">
                  {t(link.key)}
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex flex-1 items-center justify-end">
              <div className="nb-actions hidden items-center gap-1.5 lg:flex">
                <LocaleSelector />
                <a
                  href={safeExternalUrl(site.discordInvite)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("nav.discord")}
                  className="island-nav-icon-btn"
                >
                  <DiscordIcon />
                </a>
                <CartButton />
                {!site.isTenant && isOwner && (
                  <Link
                    href="/dashboard-hm2025"
                    className="rounded-full border border-accent/50 px-4 py-2 text-xs font-semibold text-accent transition-colors hover:border-accent hover:bg-accent/10"
                  >
                    Dashboard
                  </Link>
                )}
                <UserMenu variant="island" />
                <Link href={site.isTenant ? `/s/${site.tenantSlug}/#shop` : "/#shop"} className="island-nav-cta">
                  {t("nav.shopNow")}
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-label="Toggle navigation menu"
                className={`island-nav-hamburger ${open ? "is-open" : ""} lg:hidden`}
              >
                <span className="sr-only">Menu</span>
                <svg className="icon-menu" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <rect x="2" y="4.75" width="14" height="1.5" rx="1" fill="currentColor" />
                  <rect x="2" y="8.25" width="14" height="1.5" rx="1" fill="currentColor" />
                  <rect x="2" y="11.75" width="14" height="1.5" rx="1" fill="currentColor" />
                </svg>
                <svg className="icon-close" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <polyline points="4,7 9,12 14,7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile bottom sheet + backdrop */}
      <div className={`island-sheet-overlay lg:hidden ${open ? "is-visible" : ""}`} onClick={() => setOpen(false)} aria-hidden />
      <div className={`island-sheet lg:hidden ${open ? "is-open" : ""}`}>
        <div className="island-sheet-panel">
          <div className="island-sheet-handle" />
          <ul className="flex flex-col gap-0.5 px-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={resolveHref(link.href)} onClick={() => setOpen(false)} className="island-sheet-link">
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>

          <div className="island-sheet-divider" />

          <div className="flex flex-col gap-2 px-4 pt-2">
            <div className="flex items-center justify-center gap-3 py-1">
              <LocaleSelector />
              <CartButton />
            </div>

            {user ? (
              <>
                <div className="flex items-center justify-center gap-2 py-1">
                  {user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar} alt="" className="h-6 w-6 rounded-full" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-white">{user.username}</span>
                </div>
                {(user.role === "admin" || (user.email && OWNER_EMAILS.includes(user.email.toLowerCase()))) && (
                  <Link
                    href="/dashboard-hm2025"
                    onClick={() => setOpen(false)}
                    className="island-sheet-cta-secondary"
                  >
                    Dashboard
                  </Link>
                )}
                <Link href="/track" onClick={() => setOpen(false)} className="island-sheet-cta-secondary">
                  {t("auth.myOrders")}
                </Link>
                <button
                  type="button"
                  onClick={() => { logout(); setOpen(false); }}
                  className="island-sheet-cta-secondary"
                >
                  {t("auth.logout")}
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)} className="island-sheet-cta-secondary">
                {t("auth.login")}
              </Link>
            )}

            <a
              href={safeExternalUrl(site.discordInvite)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="island-sheet-cta-secondary"
            >
              <DiscordIcon className="icon h-4 w-4" />
              {t("nav.discord")}
            </a>

            <Link
              href={site.isTenant ? `/s/${site.tenantSlug}/#shop` : "/#shop"}
              onClick={() => setOpen(false)}
              className="island-sheet-cta-primary"
            >
              {t("nav.shopNow")}
            </Link>
          </div>
        </div>
      </div>

      <CartDrawer
        open={cart.isOpen}
        lines={cart.lines}
        total={cart.total}
        onClose={cart.closeCart}
        onUpdateQuantity={cart.updateQuantity}
        onRemove={cart.removeItem}
        onClear={cart.clear}
      />
    </>
  );
}
