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
import { getCourseBySlug, getCourses } from "@/lib/actions/course";
import { SpotsLeft } from "@/components/SpotsLeft";
import { CourseEnquiryFormSyncedToDetailBatch } from "@/components/CourseEnquiryFormSyncedToDetailBatch";
import { CourseEnquirySidebarPanel } from "@/components/CourseEnquirySidebarPanel";
import { CourseAgendaSection } from "@/components/CourseAgendaSection";
import { CourseDetailBatchProvider } from "@/contexts/CourseBatchContext";
import { MobileStickyEnquiryBar } from "@/components/MobileStickyEnquiryBar";
import { EarlyBirdCourseBanners } from "@/components/EarlyBirdCourseBanners";
import { CourseBatchesSummary } from "@/components/CourseBatchesSummary";

type Props = { params: Promise<{ slug: string }> };

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course || course.status !== "open") {
    notFound();
  }

  // Get related courses
  const allCourses = await getCourses();
  const relatedCourses = (course.relatedCourseSlugs || [])
    .map((relatedSlug) => allCourses.find((c) => c.slug === relatedSlug))
    .filter((c): c is NonNullable<typeof c> => c !== undefined && c.status === "open")
    .slice(0, 2); // Limit to 2 related courses

  // Use course data directly (it includes all detail fields)
  const detail = course;

  return (
    <div className="min-h-screen bg-background pb-6 text-white md:pb-0">
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
        <CourseDetailBatchProvider batches={detail.batches}>
          <div className="grid gap-10 lg:grid-cols-[1fr_340px] lg:gap-12">
          {/* Main content */}
          <div className="min-w-0">
            <div className="mb-6">
              <EarlyBirdCourseBanners course={course} />
            </div>
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
                  <>
                    {detail.batches && detail.batches.length > 0 ? (
                      <CourseBatchesSummary
                        batches={detail.batches}
                        fallbackDuration={detail.duration}
                        fallbackLocation={detail.location}
                      />
                    ) : (
                      <div className="mt-6 flex flex-wrap gap-6 text-sm text-white/80">
                        {detail.dateRange ? (
                          <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-accentGold/80" aria-hidden />
                            {detail.dateRange}
                          </span>
                        ) : null}
                        {detail.duration ? (
                          <span className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-accentGold/80" aria-hidden />
                            {detail.duration}
                          </span>
                        ) : null}
                        {detail.location ? (
                          <span className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accentGold/80" aria-hidden />
                            <span className="leading-relaxed">{detail.location}</span>
                          </span>
                        ) : null}
                        {detail.maxParticipants ? (
                          <span className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-accentGold/80" aria-hidden />
                            Max {detail.maxParticipants} delegates
                          </span>
                        ) : null}
                      </div>
                    )}
                    {detail.batches && detail.batches.length > 0 && detail.maxParticipants ? (
                      <div className="mt-4 flex flex-wrap gap-6 text-sm text-white/80">
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-accentGold/80" aria-hidden />
                          Max {detail.maxParticipants} delegates
                        </span>
                      </div>
                    ) : null}
                  </>
                )}
                <div className="mt-4 flex items-center gap-2">
                  {course.cpd && (
                    <span className="rounded-full border border-accentGold/50 px-3 py-1 text-[0.65rem] uppercase tracking-wider text-accentGold">
                      {course.cpd}
                    </span>
                  )}
                  {course.provider && (
                    <span className="text-xs text-white/50">Provider: {course.provider}</span>
                  )}
                </div>
              </div>
            </div>

            {detail.overview && detail.overview.length > 0 ? (
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
              </>
            ) : null}

            {detail.learningPoints && detail.learningPoints.length > 0 ? (
              <>
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
              </>
            ) : null}

            <CourseAgendaSection course={{ agenda: detail.agenda, batches: detail.batches }} />

            {detail.requirements && detail.requirements.length > 0 ? (
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
            ) : null}

            {(detail.instructors && detail.instructors.length > 0) || detail.instructor ? (
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
                          {instructor.badges && instructor.badges.length > 0 && (
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
                ) : detail.instructor ? (
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
                      {detail.instructor.badges && detail.instructor.badges.length > 0 && (
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
                      )}
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {relatedCourses.length > 0 ? (
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
            ) : null}
          </div>

          {/* Sidebar — Enquiry-first flow */}
          <aside className="scrollbar-brand lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:overscroll-y-contain lg:self-start lg:[scrollbar-gutter:stable]">
            <div
              id="course-enquiry"
              className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.06] to-black/40 shadow-xl"
            >
              <div className="rounded-t-2xl border-b border-white/5 bg-accentGold/10 px-5 py-4">
                <h3 className="font-semibold text-white">Enquire about this course</h3>
                <p className="mt-0.5 text-xs text-white/60">
                  Ask questions first. Booking is completed after approval.
                </p>
                {detail?.maxParticipants && (
                  <div className="mt-2">
                    <SpotsLeft courseId={course.id} maxParticipants={detail.maxParticipants} />
                  </div>
                )}
              </div>
              <div className="p-5">
                {detail?.pricing ? (
                  <CourseEnquirySidebarPanel
                    courseId={course.id}
                    courseSlug={slug}
                    pricing={detail.pricing}
                    batches={detail.batches}
                    packageIncludes={detail.packageIncludes}
                    courseDuration={detail.duration}
                    courseLocation={detail.location}
                  />
                ) : (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                      Total price
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-white">On request</p>
                    <p className="mt-1 text-xs text-accentGold">
                      Contact us for pricing and early-bird options.
                    </p>
                    <CourseEnquiryFormSyncedToDetailBatch
                      courseSlug={slug}
                      courseId={course.id}
                      batches={detail.batches}
                      courseDuration={detail.duration}
                      courseLocation={detail.location}
                      batchPickerVariant="sidebar"
                    />
                    <p className="mt-4 text-center text-xs text-white/50">
                      By enquiring, you agree to our{" "}
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
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>
        </CourseDetailBatchProvider>
      </div>

      <MobileStickyEnquiryBar fixedCourse={course} variant="courseDetail" />
    </div>
  );
}
