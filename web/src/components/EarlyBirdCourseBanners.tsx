"use client";

import Link from "next/link";
import type { Course } from "@/types/course";
import { isEarlyBirdUntilValid, pickNextValidEarlyBirdBatch } from "@/lib/early-bird";
import { EarlyBirdGoldStripHeadline } from "@/components/EarlyBirdGoldStripHeadline";

export function EarlyBirdCourseBanners({
  course,
  className,
}: {
  course: Course;
  className?: string;
}) {
  const pricing = course.pricing;
  const earlyBird = pricing?.earlyBird;
  if (!earlyBird) return null;

  const until =
    (course.batches?.length
      ? pickNextValidEarlyBirdBatch(course.batches)?.earlyBirdUntil?.trim()
      : undefined) || earlyBird.until?.trim();
  if (!until || !isEarlyBirdUntilValid(until)) return null;

  return (
    <section className={className}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-full rounded-xl bg-[#111114] px-8 py-7 shadow-[0_18px_60px_rgba(0,0,0,0.55)] sm:px-10 sm:py-8">
            <p className="font-sans text-base font-extrabold uppercase leading-snug tracking-[0.28em] text-accentGold antialiased sm:text-lg sm:font-black">
              Early Bird Available, Don&apos;t miss out
            </p>
          </div>

          <div className="flex w-full flex-col gap-4 rounded-xl bg-accentGold px-8 py-7 shadow-[0_18px_60px_rgba(0,0,0,0.35)] sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-8 sm:text-left">
            <EarlyBirdGoldStripHeadline
              amount={earlyBird.amount}
              standardAmount={pricing?.standard?.amount}
              until={until}
              courseTitle={course.title}
            />
            <Link
              href="#course-enquiry"
              className="inline-flex items-center justify-center rounded-full border border-background/30 bg-background/10 px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-background transition hover:bg-background/15"
            >
              Enquire
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

