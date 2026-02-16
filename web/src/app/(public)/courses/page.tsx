import Link from "next/link";
import { COURSES } from "@/lib/constants/courses";

export default function CoursesPage() {
  return (
    <div className="bg-background px-4 py-16 text-white md:py-20">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
            Courses
          </p>
          <h1 className="font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl">
            Two intensive tracks. One academy.
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Course Provider: Kaleidoscope Dental Academy
          </p>
        </header>
        <div className="space-y-6">
          {COURSES.map((course) => (
            <article
              key={course.slug}
              className="rounded-3xl border border-white/5 bg-gradient-to-r from-white/[0.03] to-black/90 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.85)]"
            >
              <span className="inline-block rounded-full border border-accentGold/60 px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-accentGold">
                {course.cpd}
              </span>
              <h2 className="mt-4 text-lg font-semibold tracking-tight">
                {course.title}
              </h2>
              <p className="mt-2 text-sm text-white/70">
                {course.description}
              </p>
              <p className="mt-2 text-xs text-white/50">
                Course Provider: {course.provider}
              </p>
              <Link
                href={`/courses/${course.slug}`}
                className="mt-4 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-accentGold transition hover:text-accentGold/80"
              >
                View course →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
