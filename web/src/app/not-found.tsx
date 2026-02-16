import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-white">
      <h1 className="font-[var(--font-playfair)] text-3xl tracking-tight">
        404 – Page not found
      </h1>
      <p className="mt-2 text-sm text-white/70">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full border border-accentGold px-6 py-2 text-sm font-semibold uppercase tracking-[0.16em] text-accentGold transition hover:bg-accentGold hover:text-background"
      >
        Go home
      </Link>
    </div>
  );
}
