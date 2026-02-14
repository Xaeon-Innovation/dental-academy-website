import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "#philosophy", label: "Philosophy" }
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-black/40 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
        <Link href="/" className="text-sm font-semibold tracking-[0.2em] text-accentGold">
          KALEIDOSCOPE
        </Link>
        <nav className="hidden gap-8 text-sm font-medium text-white/80 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="#portal"
          className="rounded-full border border-accentGold px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accentGold transition hover:bg-accentGold hover:text-background"
        >
          Student Portal
        </Link>
      </div>
    </header>
  );
}

