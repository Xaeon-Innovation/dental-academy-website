import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Check,
  Info,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { getCourseBySlug, getCourseDetail, COURSES } from "@/lib/constants/courses";

type Props = { params: Promise<{ slug: string }> };

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  const detail = getCourseDetail(slug);

  if (!course) notFound();

  const relatedCourses = COURSES.filter((c) => c.slug !== slug);

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Breadcrumb */}
      <div className="border-b border-white/5 bg-black/20">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <nav className="flex items-center gap-2 text-xs text-white/60">
            <Link href="/" className="transition hover:text-accentGold">
              Home
            </Link>
            <span aria-hidden>/</span>
            <Link href="/courses" className="transition hover:text-accentGold">
              Courses
            </Link>
            <span aria-hidden>/</span>
            <span className="text-white/90">{course.title}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_340px] lg:gap-12">
          {/* Main content */}
          <div className="min-w-0">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.04] via-transparent to-black/40">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(201,168,110,0.12),transparent)]" />
              <div className="relative p-6 md:p-8">
                {detail?.registrationBadge && (
                  <span className="inline-block rounded-lg border border-accentGold/50 bg-accentGold/10 px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-accentGold">
                    {detail.registrationBadge}
                  </span>
                )}
                <h1 className="mt-4 font-[var(--font-playfair)] text-3xl font-semibold tracking-tight md:text-4xl">
                  {course.title}
                </h1>
                <p className="mt-2 text-white/70">{course.description}</p>
                {detail && (
                  <div className="mt-6 flex flex-wrap gap-6 text-sm text-white/80">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-accentGold/80" aria-hidden />
                      {detail.dateRange}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-accentGold/80" aria-hidden />
                      {detail.duration}
                    </span>
                    <span className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accentGold/80" aria-hidden />
                      <span className="leading-relaxed">{detail.location}</span>
                    </span>
                    {detail.maxParticipants && (
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-accentGold/80" aria-hidden />
                        Max {detail.maxParticipants} participants
                      </span>
                    )}
                  </div>
                )}
                <div className="mt-4 flex items-center gap-2">
                  <span className="rounded-full border border-accentGold/50 px-3 py-1 text-[0.65rem] uppercase tracking-wider text-accentGold">
                    {course.cpd}
                  </span>
                  <span className="text-xs text-white/50">Provider: {course.provider}</span>
                </div>
              </div>
            </div>

            {detail ? (
              <>
                {/* Course Overview */}
                <section className="mt-10">
                  <h2 className="font-[var(--font-playfair)] text-xl font-semibold tracking-tight text-white">
                    Course Overview
                  </h2>
                  <div className="mt-4 space-y-4 text-sm leading-relaxed text-white/80">
                    {detail.overview.map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </section>

                {/* What You Will Learn */}
                <section className="mt-10">
                  <h2 className="font-[var(--font-playfair)] text-xl font-semibold tracking-tight text-white">
                    What You Will Learn
                  </h2>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {detail.learningPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accentGold/20 text-accentGold">
                          <Check className="h-3 w-3" aria-hidden />
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Course Agenda */}
                <section className="mt-10">
                  <h2 className="font-[var(--font-playfair)] text-xl font-semibold tracking-tight text-white">
                    Course Agenda
                  </h2>
                  <div className="mt-4 space-y-4">
                    {detail.agenda.map((day) => (
                      <div
                        key={day.day}
                        className="rounded-xl border border-white/5 bg-white/[0.02] p-5 transition hover:border-white/10"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-accentGold">
                            {day.day} ({day.date})
                          </span>
                          <span className="text-xs text-white/50">{day.time}</span>
                        </div>
                        <h3 className="mt-2 font-medium text-white">{day.title}</h3>
                        <ul className="mt-3 space-y-1.5 pl-1 text-sm text-white/70">
                          {day.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accentGold/60" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Requirements */}
                {detail.requirements.length > 0 && (
                  <section className="mt-10">
                    <h2 className="font-[var(--font-playfair)] text-xl font-semibold tracking-tight text-white">
                      Requirements
                    </h2>
                    <ul className="mt-4 space-y-3">
                      {detail.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accentGold/10 text-accentGold">
                            <Info className="h-3 w-3" aria-hidden />
                          </span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Instructors */}
                <section className="mt-10">
                  <h2 className="font-[var(--font-playfair)] text-xl font-semibold tracking-tight text-white">
                    {detail.instructors && detail.instructors.length > 1 ? "Instructors" : "Instructor"}
                  </h2>
                  {detail.instructors && detail.instructors.length > 0 ? (
                    <div className="mt-4 space-y-4">
                      {detail.instructors.map((instructor, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-5 sm:flex-row sm:items-start"
                        >
                          {instructor.imageUrl ? (
                            <Image
                              src={instructor.imageUrl}
                              alt={instructor.name}
                              width={80}
                              height={80}
                              className="h-20 w-20 shrink-0 rounded-full object-cover bg-white/5"
                            />
                          ) : (
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/5 text-2xl font-semibold text-accentGold">
                              {instructor.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-white">{instructor.name}</p>
                            <p className="mt-0.5 text-xs text-accentGold/90">
                              {instructor.credentials}
                            </p>
                            <p className="mt-3 text-sm leading-relaxed text-white/70">
                              {instructor.bio}
                            </p>
                            {instructor.badges.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {instructor.badges.map((badge) => (
                                  <span
                                    key={badge}
                                    className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70"
                                  >
                                    {badge}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-col gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-5 sm:flex-row sm:items-start">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/5 text-2xl font-semibold text-accentGold">
                        {detail.instructor.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white">{detail.instructor.name}</p>
                        <p className="mt-0.5 text-xs text-accentGold/90">
                          {detail.instructor.credentials}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-white/70">
                          {detail.instructor.bio}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {detail.instructor.badges.map((badge) => (
                            <span
                              key={badge}
                              className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {/* Related Courses */}
                {relatedCourses.length > 0 && (
                  <section className="mt-12">
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="font-[var(--font-playfair)] text-xl font-semibold tracking-tight text-white">
                        Related Courses
                      </h2>
                      <Link
                        href="/courses"
                        className="text-xs font-semibold uppercase tracking-wider text-accentGold transition hover:text-accentGold/80"
                      >
                        View all courses →
                      </Link>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {relatedCourses.map((related) => (
                        <Link
                          key={related.slug}
                          href={`/courses/${related.slug}`}
                          className="group rounded-xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-accentGold/20 hover:bg-white/[0.04]"
                        >
                          <p className="font-medium text-white group-hover:text-accentGold/90">
                            {related.title}
                          </p>
                          <p className="mt-1 text-sm text-white/60">{related.description}</p>
                          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-accentGold">
                            View details
                            <ArrowRight className="h-3.5 w-3 transition group-hover:translate-x-0.5" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </>
            ) : (
              <section className="mt-10">
                <p className="text-white/70">{course.description}</p>
                <p className="mt-2 text-xs text-white/50">
                  Course Provider: {course.provider}
                </p>
              </section>
            )}
          </div>

          {/* Sidebar — Secure Your Spot */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.06] to-black/40 shadow-xl">
              <div className="rounded-t-2xl border-b border-white/5 bg-accentGold/10 px-5 py-4">
                <h3 className="font-semibold text-white">Secure Your Spot</h3>
                <p className="mt-0.5 text-xs text-white/60">
                  Limited seats available for this intake.
                </p>
              </div>
              <div className="p-5">
                {detail?.pricing ? (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                      Total price
                    </p>
                    {detail.pricing.earlyBird && (
                      <div className="mt-2">
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-semibold text-white">
                            {detail.pricing.earlyBird.amount}
                          </p>
                          <span className="rounded-full border border-accentGold/50 bg-accentGold/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-accentGold">
                            Early Bird
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-white/60">
                          Until {detail.pricing.earlyBird.until}
                        </p>
                      </div>
                    )}
                    <div className="mt-3">
                      <p className="text-xl font-semibold text-white/90">
                        {detail.pricing.standard.amount}
                      </p>
                      <p className="mt-0.5 text-xs text-white/60">
                        From {detail.pricing.standard.from}
                      </p>
                    </div>
                    {detail.pricing.singleOccupancyUpgrade && (
                      <p className="mt-2 text-xs text-white/60">
                        Single occupancy upgrade: +{detail.pricing.singleOccupancyUpgrade}
                      </p>
                    )}
                    {detail.packageIncludes && detail.packageIncludes.length > 0 && (
                      <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/70">
                          Package includes:
                        </p>
                        <ul className="space-y-1.5">
                          {detail.packageIncludes.map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs text-white/70">
                              <Check className="h-3 w-3 shrink-0 text-accentGold/80" aria-hidden />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                      Total price
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-white">On request</p>
                    <p className="mt-1 text-xs text-accentGold">
                      Contact us for pricing and early-bird options.
                    </p>
                  </>
                )}
                <Link
                  href={`/courses/${slug}/register`}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-accentGold py-3.5 text-sm font-semibold uppercase tracking-wider text-background transition hover:bg-accentGold/90"
                >
                  Register now
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <p className="mt-4 text-center text-xs text-white/50">
                  By registering, you agree to our{" "}
                  <Link href="/terms" className="text-accentGold/80 underline hover:text-accentGold">
                    Terms
                  </Link>
                  .
                </p>
                <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <p className="text-sm font-medium text-white/90">Have questions?</p>
                  <Link
                    href="/contact"
                    className="mt-1 flex items-center gap-2 text-sm text-accentGold transition hover:text-accentGold/80"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    Contact support
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
