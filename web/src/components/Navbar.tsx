"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getStudentProfile } from "@/lib/actions/student";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/courses", label: "Courses" },
  { href: "/cases", label: "Cases" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null);
  const enrollHref = user ? "/courses" : "/portal?redirect=" + encodeURIComponent("/courses");

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
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo/logoTransparent.png"
            alt="Kaleidoscope Dental Academy"
            width={120}
            height={42}
            className="h-auto w-auto object-contain"
            priority
          />
        </Link>
        <nav className="hidden gap-1 text-sm font-medium md:flex">
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
        <div className="flex items-center gap-2">
          {user ? (
            isAdmin ? (
              <Link
                href="/admin"
                className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-medium text-white/90 transition hover:border-accentGold/50 hover:text-white"
                title={user.email ?? undefined}
              >
                {displayLabel}
              </Link>
            ) : (
              <Link
                href="/portal/dashboard"
                className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-medium text-white/90 transition hover:border-accentGold/50 hover:text-white"
                title={user.email ?? undefined}
              >
                {displayLabel}
              </Link>
            )
          ) : (
            <Link
              href={enrollHref}
              className="rounded-full border border-accentGold bg-accentGold px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-background transition hover:border-accentGold/90 hover:bg-accentGold/90"
            >
              Enroll
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
