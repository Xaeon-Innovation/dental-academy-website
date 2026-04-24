"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getStudentProfile } from "@/lib/actions/student";
import { Menu, X } from "lucide-react";

const ALL_NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/courses", label: "Courses" },
  { href: "/cases", label: "Cases" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar({ showBlogInNav = true }: { showBlogInNav?: boolean }) {
  const navLinks = showBlogInNav
    ? ALL_NAV_LINKS
    : ALL_NAV_LINKS.filter((link) => link.href !== "/blog");
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const enquireHref = "/courses";
  const portalHref = "/portal?redirect=" + encodeURIComponent("/portal/dashboard");

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!user?.uid) {
      const id = setTimeout(() => setProfileDisplayName(null), 0);
      return () => clearTimeout(id);
    }
    let cancelled = false;
    getStudentProfile(user.uid).then((profile) => {
      if (!cancelled) setProfileDisplayName(profile?.displayName ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const displayLabel =
    profileDisplayName?.trim() ||
    user?.displayName?.trim() ||
    user?.email?.split("@")[0] ||
    "Account";

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-black/40 backdrop-blur">
      {/* Mobile: logo left, actions right. md+: 4 columns — logo | nav (2 cols, centered) | CTA */}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 py-4 pl-2 pr-4 md:grid md:grid-cols-4 md:items-center md:justify-items-stretch md:gap-4 md:py-5 md:pl-3 md:pr-6">
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-center justify-self-start md:col-span-1 -ml-1 md:-ml-2"
        >
          <Image
            src="/images/logo/logoTransparent.png"
            alt="Kaleidoscope Dental Academy"
            width={360}
            height={126}
            className="h-9 w-auto object-contain object-left sm:h-10 md:h-12"
            sizes="(max-width: 768px) 190px, 260px"
            quality={100}
            priority
            unoptimized
          />
        </Link>
        <nav
          className="hidden gap-1 text-sm font-medium md:col-span-2 md:flex md:w-full md:flex-wrap md:items-center md:justify-center"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => {
            const isHome = link.href === "/";
            const isActive = isHome
              ? pathname === "/"
              : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-2 transition hover:text-white ${
                  isActive ? "text-white" : "text-white/80"
                }`}
              >
                {link.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-accentGold"
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center justify-end gap-2 justify-self-end md:col-span-1">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white md:hidden"
            {...(mobileMenuOpen ? { "aria-expanded": "true" } : { "aria-expanded": "false" })}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          {user ? (
            isAdmin ? (
              <Link
                href="/admin"
                className="rounded-full border border-white/20 px-3 py-2 text-xs font-medium text-white/90 transition hover:border-accentGold/50 hover:text-white"
                title={user.email ?? undefined}
              >
                {displayLabel}
              </Link>
            ) : (
              <Link
                href="/portal/dashboard"
                className="rounded-full border border-white/20 px-3 py-2 text-xs font-medium text-white/90 transition hover:border-accentGold/50 hover:text-white"
                title={user.email ?? undefined}
              >
                {displayLabel}
              </Link>
            )
          ) : (
            <>
              <Link
                href={enquireHref}
                className="hidden rounded-full border border-accentGold bg-accentGold px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-background transition hover:border-accentGold/90 hover:bg-accentGold/90 md:inline-flex"
              >
                Enquire
              </Link>
              <Link
                href={portalHref}
                className="hidden rounded-full border border-white/20 px-3 py-2 text-xs font-medium text-white/90 transition hover:border-accentGold/50 hover:text-white sm:inline-flex"
              >
                Portal
              </Link>
            </>
          )}
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[250] md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute inset-x-0 top-0 border-b border-white/10 bg-black/95 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="absolute inset-x-0 top-[73px] max-h-[calc(100dvh-73px)] overflow-y-auto border-t border-white/5 bg-black/95 px-4 py-4 backdrop-blur">
            <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
              {navLinks.map((link) => {
                const isHome = link.href === "/";
                const isActive = isHome ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-md px-3 py-3 text-base font-medium transition ${
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-white/85 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {!user && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Link
                    href={enquireHref}
                    className="inline-flex items-center justify-center rounded-full border border-accentGold bg-accentGold px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-background"
                  >
                    Enquire
                  </Link>
                  <Link
                    href={portalHref}
                    className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-3 text-xs font-medium text-white/90"
                  >
                    Portal
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
