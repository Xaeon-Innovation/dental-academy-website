"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/cases", label: "Cases" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/legacy-access", label: "Legacy access" },
  { href: "/admin/registrations", label: "Registrations" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/home", label: "Home management" },
  { href: "/admin/instructors", label: "Instructors" },
  { href: "/admin/settings", label: "Settings" },
];

function getPageTitle(pathname: string): string {
  if (pathname === "/admin") return "Dashboard";
  for (const { href, label } of navItems) {
    if (href !== "/admin" && pathname.startsWith(href)) return label;
  }
  return "Admin";
}

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Don't show sidebar on login page
  if (isLoginPage) {
    return <AdminAuthGuard>{children}</AdminAuthGuard>;
  }

  return (
    <AdminAuthGuard>
      <div className="flex min-h-screen bg-background">
        <aside className="hidden w-60 flex-col border-r border-white/10 bg-black/40 md:flex">
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
              Admin
            </p>
            {user && (
              <p
                className="mt-2 truncate text-xs text-white/60"
                title={user.email || ""}
              >
                {user.email}
              </p>
            )}
          </div>
          <nav className="flex-1 space-y-0.5 px-3 pb-4">
            {navItems.map(({ href, label }) => {
              const isActive =
                href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`block rounded-lg px-3 py-2.5 text-sm transition ${
                    isActive
                      ? "bg-accentGold/15 text-accentGold"
                      : "text-white/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          {user && (
            <div className="border-t border-white/10 p-4">
              <button
                onClick={signOut}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:border-accentGold/30 hover:bg-accentGold/10 hover:text-accentGold"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Sign out
              </button>
            </div>
          )}
        </aside>

        {mobileNavOpen && (
          <div className="fixed inset-0 z-[300] md:hidden" role="dialog" aria-modal="true">
            <button
              type="button"
              className="absolute inset-0 bg-black/70"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close admin navigation"
            />
            <div className="absolute inset-y-0 left-0 w-[min(84vw,320px)] border-r border-white/10 bg-black/95 backdrop-blur">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 p-5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
                    Admin
                  </p>
                  {user ? (
                    <p className="mt-2 truncate text-xs text-white/60" title={user.email || ""}>
                      {user.email}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="space-y-0.5 px-3 py-4">
                {navItems.map(({ href, label }) => {
                  const isActive =
                    href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`block rounded-lg px-3 py-2.5 text-sm transition ${
                        isActive
                          ? "bg-accentGold/15 text-accentGold"
                          : "text-white/80 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </nav>

              {user && (
                <div className="mt-auto border-t border-white/10 p-4">
                  <button
                    onClick={signOut}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:border-accentGold/30 hover:bg-accentGold/10 hover:text-accentGold"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <main className="flex flex-1 flex-col text-white">
          <header className="sticky top-0 z-10 border-b border-white/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex items-center gap-3 px-4 py-4 md:px-6">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white md:hidden"
                aria-label="Open admin navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
              <span className="h-8 w-1 shrink-0 rounded-full bg-accentGold" aria-hidden />
              <h1 className="font-[var(--font-playfair)] text-xl font-medium tracking-tight text-white">
                {getPageTitle(pathname)}
              </h1>
            </div>
          </header>
          <div className="flex-1 p-4 md:p-6">{children}</div>
        </main>
      </div>
    </AdminAuthGuard>
  );
}
