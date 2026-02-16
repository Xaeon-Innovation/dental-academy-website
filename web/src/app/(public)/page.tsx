import HeroSequence from "@/components/HeroSequence";
import Testimonials from "@/components/Testimonials";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { TextReveal } from "@/components/TextReveal";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* 1. Frame sequence — scroll-driven hero */}
      <HeroSequence />

      {/* 2. Our Philosophy — starts after hero so the full sequence (frames + IPLACE + iRestore) is visible first */}
      <section
        id="philosophy"
        className="relative z-30 bg-background px-4 py-24 text-white md:py-32"
      >
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center">
          <div>
            <TextReveal className="block text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
              Our Philosophy
            </TextReveal>
            <h2 className="mt-4 font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl">
              <TextReveal>
                Precision-driven implant dentistry, from placement to
                perfection.
              </TextReveal>
            </h2>
            <p className="mt-6 text-sm leading-relaxed text-white/70 md:text-base">
              Kaleidoscope Dental Academy exists for clinicians who demand more:
              more clarity, more control, and more repeatable outcomes.
            </p>
          </div>
          <div className="h-64 rounded-3xl bg-gradient-to-br from-accentGold/10 via-white/5 to-black/60 shadow-[0_0_80px_rgba(0,0,0,0.8)] md:h-80" />
        </div>
      </section>

      {/* 3. Course Tracks */}
      <section
        id="course-tracks"
        className="relative z-20 bg-background px-4 py-20 text-white md:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <TextReveal className="block text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
            Course Tracks
          </TextReveal>
          <h2 className="mt-4 font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl">
            <TextReveal>Two intensive tracks. One academy.</TextReveal>
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {[
              {
                title: "iPlace // iRestore",
                body: "Single and Multiple implants intensive course. 60 Hrs of CPD.",
                provider: "Course Provider: Kaleidoscope Dental Academy",
              },
              {
                title: "FULL ARCH INTENSIVE",
                body: "(All-on-X). 46hrs of CPD.",
                provider: "Course Provider: Kaleidoscope Dental Academy",
              },
            ].map((track) => (
              <article key={track.title} className="course-track-box">
                <span className="course-track-glow" aria-hidden />
                <div className="course-track-content">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">
                      {track.title}
                    </h3>
                    <p className="mt-3 text-sm text-white/70">{track.body}</p>
                    <p className="mt-2 text-xs text-white/50">
                      {track.provider}
                    </p>
                  </div>
                  <span className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-accentGold/80">
                    Explore track
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials — marquee of cards with name & rating */}
      <Testimonials />

      {/* 4. CTA */}
      <section className="relative z-10 bg-background px-4 py-20 text-white md:py-28">
        <div className="mx-auto max-w-3xl text-center overflow-visible">
          <h2 className="font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl overflow-visible">
            <TextReveal>Start your journey</TextReveal>
          </h2>
          <p className="mt-4 text-sm text-white/70 md:text-base">
            Join the Academy and build precision-driven implant skills with
            iPlace and iRestore.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <InteractiveHoverButton href="/courses" variant="primary">
              View courses
            </InteractiveHoverButton>
            <InteractiveHoverButton href="#portal" variant="secondary">
              Student portal
            </InteractiveHoverButton>
          </div>
        </div>
      </section>
    </main>
  );
}
