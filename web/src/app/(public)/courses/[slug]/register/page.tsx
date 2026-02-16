import { redirect } from "next/navigation";
import Link from "next/link";
import { getCourseBySlug } from "@/lib/constants/courses";
import EnrollmentForm from "./EnrollmentForm";

type Props = { params: Promise<{ slug: string }> };

export default async function RegisterPage({ params }: Props) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);

  if (!course) {
    redirect("/courses");
  }

  return (
    <div className="bg-background px-4 py-16 text-white md:py-20">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/courses/${slug}`}
          className="mb-6 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-accentGold transition hover:text-accentGold/80"
        >
          ← Back to course
        </Link>
        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accentGold">
            Enrollment
          </p>
          <h1 className="mt-2 font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl">
            Enroll in {course.title}
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Complete the form below. We will contact you with further details and early
            access to course registration.
          </p>
        </header>
        <EnrollmentForm course={{ slug: course.slug, id: course.id, title: course.title }} />
      </div>
    </div>
  );
}
