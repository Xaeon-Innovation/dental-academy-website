"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";

export default function AdminLayout({
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
        <aside className="w-56 border-r border-white/10 bg-black/40 p-4 flex flex-col">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
          Admin
        </p>
          {user && (
            <p className="mt-2 text-xs text-white/60 truncate" title={user.email || ""}>
              {user.email}
            </p>
          )}
          <nav className="mt-6 space-y-2 text-sm text-white/80 flex-1">
          <Link href="/admin" className="block hover:text-white">
            Dashboard
          </Link>
          <Link href="/admin/courses" className="block hover:text-white">
            Courses
          </Link>
          <Link href="/admin/registrations" className="block hover:text-white">
            Registrations
          </Link>
          <Link href="/admin/blog" className="block hover:text-white">
            Blog
          </Link>
          <Link href="/admin/categories" className="block hover:text-white">
            Categories
          </Link>
          <Link href="/admin/instructors" className="block hover:text-white">
            Instructors
          </Link>
          <Link href="/admin/settings" className="block hover:text-white">
            Settings
          </Link>
        </nav>
          {user && (
            <button
              onClick={signOut}
              className="mt-4 text-xs text-white/60 hover:text-white transition"
            >
              Sign Out
            </button>
          )}
      </aside>
      <main className="flex-1 p-6 text-white">{children}</main>
    </div>
    </AdminAuthGuard>
  );
}
