import Link from "next/link";
import Image from "next/image";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/courses", label: "Courses" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
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
          href="/courses"
          className="rounded-full border border-accentGold bg-accentGold px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-background transition hover:border-accentGold/90 hover:bg-accentGold/90"
        >
          Enroll
        </Link>
      </div>
    </header>
  );
}
