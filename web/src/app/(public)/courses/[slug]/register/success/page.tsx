import Link from "next/link";
import { getCourseBySlug } from "@/lib/constants/courses";

type Props = { params: Promise<{ slug: string }> };

export default async function RegistrationSuccessPage({ params }: Props) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  const courseTitle = course?.title ?? slug;

  return (
    <div className="bg-background px-4 py-16 text-white md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-[var(--font-playfair)] text-3xl tracking-tight md:text-4xl">
          Registration successful
        </h1>
        <p className="mt-4 text-white/70">
          Thank you for registering for {courseTitle}. You will receive a confirmation
          email shortly.
        </p>
        <Link
          href="/courses"
          className="mt-8 inline-block rounded-full border border-accentGold px-6 py-2 text-sm font-semibold uppercase tracking-[0.16em] text-accentGold transition hover:bg-accentGold hover:text-background"
        >
          Back to courses
        </Link>
      </div>
    </div>
  );
}
