import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
        <p>
          &copy; {new Date().getFullYear()} Kaleidoscope Dental Academy. All
          rights reserved.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/terms"
            className="text-white/60 transition hover:text-white/80"
          >
            Terms and Conditions
          </Link>
          <p className="text-[0.7rem] uppercase tracking-[0.18em] text-white/40">
            Precision Implant Education
          </p>
          <Link
            href="/admin/login"
            className="text-white/40 transition hover:text-white/60"
            aria-label="Staff login"
          >
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
