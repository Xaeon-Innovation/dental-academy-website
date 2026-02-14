export default function CoursesPage() {
  const courses = [
    {
      title: "iPlace Foundations",
      track: "Surgery",
      level: "Intermediate",
      description:
        "A structured, stepwise approach to implant placement that emphasizes planning, stability, and tissue respect."
    },
    {
      title: "iRestore Architect",
      track: "Prosthetics",
      level: "Advanced",
      description:
        "From single units to full-arch, build restorations that harmonize biology, mechanics, and aesthetics."
    },
    {
      title: "Digital Implant Workflow",
      track: "Digital",
      level: "All Levels",
      description:
        "Integrate intraoral scanning, CBCT data, and guided surgery into a cohesive, digital-first protocol."
    }
  ];

  return (
    <div className="bg-background px-4 py-16 text-white md:py-20">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-6 rounded-3xl border border-white/5 bg-black/60 p-5 text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
            Filters
          </p>
          <div className="space-y-4 text-xs text-white/70">
            <div>
              <p className="mb-2 font-semibold text-white/80">Track</p>
              <ul className="space-y-1">
                <li>Surgery</li>
                <li>Prosthetics</li>
                <li>Digital</li>
              </ul>
            </div>
            <div>
              <p className="mb-2 font-semibold text-white/80">Level</p>
              <ul className="space-y-1">
                <li>Foundation</li>
                <li>Intermediate</li>
                <li>Advanced</li>
              </ul>
            </div>
          </div>
        </aside>
        <main>
          <header className="mb-8 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
              Courses
            </p>
            <h1 className="font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl">
              Build your implant mastery, one system at a time.
            </h1>
          </header>
          <div className="space-y-5">
            {courses.map((course) => (
              <article
                key={course.title}
                className="rounded-3xl border border-white/5 bg-gradient-to-r from-white/[0.03] to-black/90 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.85)]"
              >
                <div className="flex flex-wrap items-center gap-3 text-[0.65rem] uppercase tracking-[0.18em] text-white/60">
                  <span className="rounded-full border border-accentGold/60 px-3 py-1 text-accentGold">
                    {course.track}
                  </span>
                  <span>{course.level}</span>
                </div>
                <h2 className="mt-4 text-lg font-semibold tracking-tight">
                  {course.title}
                </h2>
                <p className="mt-3 text-sm text-white/70">{course.description}</p>
              </article>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

