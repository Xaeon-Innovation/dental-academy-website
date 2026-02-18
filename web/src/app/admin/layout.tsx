import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-56 border-r border-white/10 bg-black/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
          Admin
        </p>
        <nav className="mt-6 space-y-2 text-sm text-white/80">
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
      </aside>
      <main className="flex-1 p-6 text-white">{children}</main>
    </div>
  );
}
