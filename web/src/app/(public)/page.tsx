import Image from "next/image";
import Link from "next/link";
import HeroSequence from "@/components/HeroSequence";
import ScrollIndicator from "@/components/ScrollIndicator";
import Testimonials from "@/components/Testimonials";
import { HomeCtaButtons } from "@/components/HomeCtaButtons";
import { TextReveal } from "@/components/TextReveal";
import { getInstructorsForPage } from "@/lib/actions/instructor";
import { getHomeSettings } from "@/lib/actions/settings";
import type { HomeSettings } from "@/types/settings";

// Always fetch latest home content (hero image, CTA, etc.) so admin uploads appear immediately
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [instructors, homeSettings] = await Promise.all([
    getInstructorsForPage("home"),
    getHomeSettings(),
  ]);

  const home: HomeSettings = homeSettings ?? {};

  const philosophyHeading = home.philosophyHeading || "Our Philosophy";
  const philosophyTitle =
    home.philosophyTitle ||
    "Precision-driven implant dentistry, from placement to perfection.";
  const philosophyBody =
    home.philosophyBody ||
    "Kaleidoscope Dental Academy exists for clinicians who demand more: more clarity, more control, and more repeatable outcomes.";
  const philosophyImageSrc =
    home.philosophyImageUrl || "/images/philosophy/philosophy-image.png";

  const ctaTitle = home.ctaTitle || "Start your journey";
  const ctaBody =
    home.ctaBody ||
    "Join the Academy and build precision-driven implant skills with iPlace and iRestore.";
  return (
    <main className="min-h-screen bg-background">
      <ScrollIndicator />
      {/* 1. Frame sequence — scroll-driven hero */}
      <HeroSequence />

      {/* 2. Our Philosophy — starts after hero so the full sequence (frames + IPLACE + iRestore) is visible first */}
      <section
        id="philosophy"
        className="relative z-30 mt-32 bg-background px-4 py-24 text-white md:mt-80 md:py-32"
      >
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center">
          <div>
            <TextReveal className="block text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
              {philosophyHeading}
            </TextReveal>
            <h2 className="mt-4 font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl">
              <TextReveal>{philosophyTitle}</TextReveal>
            </h2>
            <p className="mt-6 text-sm leading-relaxed text-white/70 md:text-base">
              {philosophyBody}
            </p>
          </div>
          <div className="relative h-64 overflow-hidden rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)] md:h-80">
            <Image
              src={philosophyImageSrc}
              alt="Kaleidoscope Dental Academy - Precision-driven implant dentistry"
              fill
              className="object-cover object-left"
              priority
            />
          </div>
        </div>
      </section>

      {/* 3. Course Tracks */}
      <section
        id="course-tracks"
        className="relative z-20 bg-background px-4 py-20 text-white md:py-28"
      >
        <div className="mx-auto max-w-6xl text-center">
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
                slug: "iplace-irestore",
              },
              {
                title: "FULL ARCH INTENSIVE",
                body: "(All-on-X). 46hrs of CPD.",
                provider: "Course Provider: Kaleidoscope Dental Academy",
                slug: "full-arch-intensive",
              },
            ].map((track) => (
              <article key={track.title} className="course-track-box">
                <span className="course-track-glow" aria-hidden />
                <div className="course-track-content text-center">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">
                      {track.title}
                    </h3>
                    <p className="mt-3 text-sm text-white/70">{track.body}</p>
                    <p className="mt-2 text-xs text-white/50">
                      {track.provider}
                    </p>
                  </div>
                  <Link
                    href={`/courses/${track.slug}`}
                    className="mt-6 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-accentGold/80 hover:text-accentGold"
                  >
                    Explore track
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Meet our instructors */}
      <section
        id="instructors"
        className="relative z-20 bg-background px-4 py-20 text-white md:py-28"
      >
        <div className="mx-auto max-w-6xl text-center">
          <TextReveal className="block text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
            Meet our instructors
          </TextReveal>
          <h2 className="mt-4 font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl">
            <TextReveal>Expert faculty. Real-world focus.</TextReveal>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/70 md:text-base">
            Learn from clinicians and educators who combine years of practice with a commitment to structured, hands-on training.
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-6">
            {instructors.length === 0 ? (
              <p className="w-full text-center text-sm text-white/50">
                No instructors available yet.
              </p>
            ) : (
              instructors.map((instructor) => {
                // Truncate bio to ~120 characters for card display
                const bioPreview = instructor.bio
                  ? instructor.bio.length > 120
                    ? instructor.bio.substring(0, 120).trim() + "..."
                    : instructor.bio
                  : "";
                const imageUrl = instructor.imageUrl || "/images/instructors/placeholder.png";

                return (
                  <article
                    key={instructor.id}
                    className="group relative w-full max-w-[280px] overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] transition hover:border-accentGold/20 hover:bg-white/[0.04] sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]"
                  >
                    <div className="aspect-[3/4] overflow-hidden rounded-t-2xl bg-white/5">
                      <Image
                        src={imageUrl}
                        alt={instructor.name}
                        width={320}
                        height={427}
                        className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold tracking-tight text-white">
                        {instructor.name}
                      </h3>
                      <p className="mt-1 text-xs text-accentGold/90">
                        {instructor.credentials}
                      </p>
                      {bioPreview && (
                        <p className="mt-2 text-sm leading-snug text-white/60">
                          {bioPreview}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/courses"
              className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-accentGold transition hover:text-accentGold/80"
            >
              See instructors on courses →
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials — marquee of cards with name & rating */}
      <Testimonials />

      {/* 4. CTA */}
      <section className="relative z-10 bg-background px-4 py-20 text-white md:py-28">
        <div className="mx-auto max-w-3xl text-center overflow-visible">
          <h2 className="font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl overflow-visible">
            <TextReveal>{ctaTitle}</TextReveal>
          </h2>
          <p className="mt-4 text-sm text-white/70 md:text-base">
            {ctaBody}
          </p>
          <HomeCtaButtons />
        </div>
      </section>
    </main>
  );
}
