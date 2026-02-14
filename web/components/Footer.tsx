export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
        <p>&copy; {new Date().getFullYear()} Kaleidoscope Dental Academy. All rights reserved.</p>
        <p className="text-[0.7rem] uppercase tracking-[0.18em] text-white/40">
          Precision Implant Education
        </p>
      </div>
    </footer>
  );
}

