import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseBySlug } from "@/lib/constants/courses";

type Props = { params: Promise<{ slug: string }> };

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);

  if (!course) notFound();

  return (
    <div className="bg-background px-4 py-16 text-white md:py-20">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/courses"
          className="mb-6 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-accentGold transition hover:text-accentGold/80"
        >
          ← All courses
        </Link>
        <span className="inline-block rounded-full border border-accentGold/60 px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-accentGold">
          {course.cpd}
        </span>
        <h1 className="mt-4 font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl">
          {course.title}
        </h1>
        <p className="mt-3 text-white/70">{course.description}</p>
        <p className="mt-2 text-xs text-white/50">
          Course Provider: {course.provider}
        </p>
        <Link
          href={`/courses/${slug}/register`}
          className="mt-8 inline-block rounded-full border-2 border-accentGold bg-accentGold px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-background transition hover:border-accentGold/90 hover:bg-accentGold/90"
        >
          Enroll
        </Link>
      </div>
    </div>
  );
}
