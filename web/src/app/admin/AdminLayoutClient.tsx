"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/cases", label: "Cases" },
  { href: "/admin/enquiries", label: "Enquiries" },
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

  // Don't show sidebar on login page
  if (isLoginPage) {
    return <AdminAuthGuard>{children}</AdminAuthGuard>;
  }

  return (
    <AdminAuthGuard>
      <div className="flex min-h-screen bg-background">
        <aside className="flex w-60 flex-col border-r border-white/10 bg-black/40">
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
        <main className="flex flex-1 flex-col text-white">
          <header className="sticky top-0 z-10 border-b border-white/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex items-center gap-3 px-6 py-4">
              <span className="h-8 w-1 shrink-0 rounded-full bg-accentGold" aria-hidden />
              <h1 className="font-[var(--font-playfair)] text-xl font-medium tracking-tight text-white">
                {getPageTitle(pathname)}
              </h1>
            </div>
          </header>
          <div className="flex-1 p-6">{children}</div>
        </main>
      </div>
    </AdminAuthGuard>
  );
}
