import Image from "next/image";
import Link from "next/link";
import HeroSequence from "@/components/HeroSequence";
import ScrollIndicator from "@/components/ScrollIndicator";
import { FadeIn } from "@/components/FadeIn";
import Testimonials from "@/components/Testimonials";
import { VideoTestimonialsSection } from "@/components/VideoTestimonialsSection";
import { InstructorCardsInteractive } from "@/components/InstructorCardsInteractive";
import { HomeCtaButtons } from "@/components/HomeCtaButtons";
import { EarlyBirdTripleBanners } from "@/components/EarlyBirdTripleBanners";
import { MobileStickyEnquiryBar } from "@/components/MobileStickyEnquiryBar";
import { HomeHeroCtas } from "@/components/HomeHeroCtas";
import { TextReveal } from "@/components/TextReveal";
import { getInstructorsForPage } from "@/lib/actions/instructor";
import { getHomeSettings } from "@/lib/actions/settings";
import { getTestimonialsForDisplay } from "@/lib/actions/testimonial";
import { getCourses } from "@/lib/actions/course";
import type { HomeSettings } from "@/types/settings";
import type { EnquiryCourseOption } from "@/components/EnquiryModal";

// Always fetch latest home content (hero image, CTA, etc.) so admin uploads appear immediately
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [instructors, homeSettings, testimonialsFromDb, courses] = await Promise.all([
    getInstructorsForPage("home"),
    getHomeSettings(),
    getTestimonialsForDisplay(),
    getCourses(),
  ]);

  const home: HomeSettings = homeSettings ?? {};

  const heroCtasIntroTitle =
    home.heroCtasIntroTitle?.trim() ||
    "Where your journey into focused, hands-on implant training begins.";

  const philosophyHeading = home.philosophyHeading || "Our Philosophy";
  const philosophyTitle =
    home.philosophyTitle ||
    "Precision-driven implant dentistry, from placement to perfection.";
  const philosophyBody =
    home.philosophyBody ||
    "Kaleidoscope Dental Academy exists for delegates who demand more: more clarity, more control, and more repeatable outcomes.";
  const philosophyImageSrc =
    home.philosophyImageUrl || "/images/philosophy/philosophy-image.png";

  const ctaTitle = home.ctaTitle || "Start your journey";
  const ctaBody =
    home.ctaBody ||
    "Join the Academy and build precision-driven implant skills with iPlace and iRestore.";

  const openCoursesForEnquiry: EnquiryCourseOption[] = courses
    .filter((course) => course.status === "open")
    .map((course) => ({
      id: course.id,
      slug: course.slug,
      title: course.title,
      ...(course.batches?.length ? { batches: course.batches } : {}),
      ...(course.duration?.trim() ? { courseDuration: course.duration } : {}),
      ...(course.location?.trim() ? { courseLocation: course.location } : {}),
    }));

  return (
    <main className="min-h-screen bg-background pb-6 md:pb-0">
      <ScrollIndicator />
      {/* 1. Frame sequence — scroll-driven hero */}
      <HeroSequence />

      {/* 2. Hero CTAs + Philosophy (linked flow) */}
      <section className="relative z-30 bg-background text-white">
        {/* Hero CTAs (reveals when sequence finishes) */}
        <HomeHeroCtas introTitle={heroCtasIntroTitle} availableCourses={openCoursesForEnquiry} />

        {/* Our Philosophy — immediately follows CTAs */}
        <section
          id="philosophy"
          className="px-4 pb-24 pt-20 md:pt-24 lg:pt-28 md:pb-32"
        >
          <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center">
            <FadeIn>
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
            </FadeIn>
            <FadeIn delay={0.12}>
              <div className="relative h-64 overflow-hidden rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)] md:h-80">
                <Image
                  src={philosophyImageSrc}
                  alt="Kaleidoscope Dental Academy - Precision-driven implant dentistry"
                  fill
                  className="object-cover object-left"
                  priority
                />
              </div>
            </FadeIn>
          </div>
        </section>
      </section>

      {/* 3. Course Tracks */}
      <section
        id="course-tracks"
        className="relative z-20 bg-background px-4 py-20 text-white md:py-28"
      >
        {/* Far right: left half of goldsolid only (200% + left), matches /courses */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[min(70vw,520px)] max-w-[50vw] bg-[url('/images/logo/goldsolid.png')] bg-left bg-no-repeat bg-[length:200%_auto] opacity-[0.08] [mask-image:linear-gradient(to_left,black_0%,black_22%,rgb(0_0_0_/_0.65)_48%,rgb(0_0_0_/_0.28)_72%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_left,black_0%,black_22%,rgb(0_0_0_/_0.65)_48%,rgb(0_0_0_/_0.28)_72%,transparent_100%)] sm:w-[min(74vw,760px)] sm:max-w-none sm:opacity-[0.1] md:w-[min(78vw,920px)] md:opacity-[0.12]"
        />
        <div className="relative z-10 mx-auto max-w-6xl text-center">
          <FadeIn>
            <TextReveal className="block text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
              Course Tracks
            </TextReveal>
            <h2 className="mt-4 font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl">
              <TextReveal>Two intensive tracks. One academy.</TextReveal>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/70 md:text-base">
              iPlace // iRestore and Full Arch Intensive — structured hands-on programmes with clear CPD outcomes.
            </p>
          </FadeIn>
          <div className="mt-12 flex flex-wrap justify-center gap-6">
            {(
              [
                {
                  title: "iPlace // iRestore",
                  body: "Single and Multiple implants intensive course. 60 Hrs of CPD.",
                  provider: "Course Provider: Kaleidoscope Dental Academy",
                  slug: "iplace-irestore",
                  imageSrc:
                    home.courseTrackIplaceImageUrl?.trim() ||
                    "/images/courses/iplace-irestore-home-track.png",
                },
                {
                  title: "FULL ARCH INTENSIVE",
                  body: "(All-on-X). 46hrs of CPD.",
                  provider: "Course Provider: Kaleidoscope Dental Academy",
                  slug: "full-arch-intensive",
                  imageSrc:
                    home.courseTrackFullArchImageUrl?.trim() ||
                    "/images/courses/full-arch-intensive-home-track.png",
                },
              ] as const
            ).map((track, index) => (
              <FadeIn
                key={track.title}
                delay={0.08 + index * 0.1}
                className="w-full max-w-[280px] sm:w-[calc(50%-12px)]"
              >
                <article className="course-track-box group/course h-full">
                <span className="course-track-glow" aria-hidden />
                <div className="course-track-content text-center">
                  <div className="relative -mx-6 -mt-6 mb-4 aspect-[4/3] w-[calc(100%+3rem)] overflow-hidden rounded-t-[1.5rem] transition-[margin] duration-500 group-hover/course:-mt-8">
                    <Image
                      src={track.imageSrc}
                      alt={`${track.title} course visual`}
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 640px) 100vw, 280px"
                    />
                  </div>
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
                    className="mt-6 inline-flex items-center justify-center rounded-full border border-accentGold/70 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-accentGold transition hover:border-accentGold hover:bg-accentGold/10"
                  >
                    Explore track
                  </Link>
                </div>
              </article>
              </FadeIn>
            ))}
          </div>

          <FadeIn className="mt-14 md:mt-16">
            <EarlyBirdTripleBanners courses={courses.filter((c) => c.status === "open")} />
          </FadeIn>
        </div>
      </section>

      {/* Meet our instructors */}
      <section
        id="instructors"
        className="relative z-20 bg-background px-4 py-20 text-white md:py-28"
      >
        {/* Far left: right half of goldsolid only (200% + bg-right); mirror of course-tracks strip */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-0 w-[min(70vw,520px)] max-w-[50vw] bg-[url('/images/logo/goldsolid.png')] bg-right bg-no-repeat bg-[length:200%_auto] opacity-[0.08] [mask-image:linear-gradient(to_right,black_0%,black_22%,rgb(0_0_0_/_0.65)_48%,rgb(0_0_0_/_0.28)_72%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,black_0%,black_22%,rgb(0_0_0_/_0.65)_48%,rgb(0_0_0_/_0.28)_72%,transparent_100%)] sm:w-[min(74vw,760px)] sm:max-w-none sm:opacity-[0.1] md:w-[min(78vw,920px)] md:opacity-[0.12]"
        />
        <div className="relative z-10 mx-auto max-w-6xl text-center">
          <FadeIn>
            <TextReveal className="block text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
              Meet our instructors
            </TextReveal>
            <h2 className="mt-4 font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl">
              <TextReveal>Expert faculty. Real-world focus.</TextReveal>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/70 md:text-base">
              Learn from delegates and educators who combine years of practice with a commitment to structured, hands-on training.
            </p>
          </FadeIn>
          <div className="mt-12 flex flex-wrap justify-center gap-6">
            <InstructorCardsInteractive instructors={instructors} />
          </div>
          <FadeIn className="mt-10 block text-center">
            <Link
              href="/courses"
              className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-accentGold transition hover:text-accentGold/80"
            >
              See instructors on courses →
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Testimonials — marquee of cards with name & rating (only if 5+ testimonials) */}
      {testimonialsFromDb.length >= 5 && (
        <FadeIn className="block w-full">
          <Testimonials items={testimonialsFromDb} />
        </FadeIn>
      )}

      {/* Video testimonials — grid of video cards (from admin uploads) */}
      <FadeIn className="block w-full">
        <VideoTestimonialsSection items={home.videoTestimonials} />
      </FadeIn>

      {/* 4. CTA */}
      <section className="relative z-10 bg-background px-4 py-20 text-white md:py-28">
        <FadeIn className="mx-auto max-w-3xl text-center overflow-visible" id="start-your-journey">
          <h2 className="font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl overflow-visible">
            <TextReveal>{ctaTitle}</TextReveal>
          </h2>
          <p className="mt-4 text-sm text-white/70 md:text-base">
            {ctaBody}
          </p>
          <HomeCtaButtons availableCourses={openCoursesForEnquiry} />
        </FadeIn>
      </section>

      <MobileStickyEnquiryBar courses={courses} variant="home" />
    </main>
  );
}
