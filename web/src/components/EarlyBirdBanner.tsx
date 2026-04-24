"use client";

import Link from "next/link";
import type { Course } from "@/types/course";
import { pickNextValidEarlyBirdBatch } from "@/lib/early-bird";
import { EarlyBirdGoldStripHeadline } from "@/components/EarlyBirdGoldStripHeadline";

type EarlyBirdPick = {
  course: Course;
  earlyBird: NonNullable<NonNullable<Course["pricing"]>["earlyBird"]>;
};

function parseMoneyAmountToNumber(amount: string): number | null {
  // Examples: "£6,995", "6995", "€6.995,00" (we handle common cases loosely)
  const cleaned = amount
    .replace(/[^\d.,]/g, "")
    .trim();
  if (!cleaned) return null;

  // If both separators exist, assume the last one is the decimal separator and strip the other.
  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");
  const lastSep = Math.max(lastDot, lastComma);

  if (lastSep >= 0) {
    const intPart = cleaned.slice(0, lastSep).replace(/[.,]/g, "");
    const decPart = cleaned.slice(lastSep + 1).replace(/[^\d]/g, "");
    const normalized = decPart ? `${intPart}.${decPart}` : intPart;
    const num = Number(normalized);
    return Number.isFinite(num) ? num : null;
  }

  const num = Number(cleaned.replace(/[^\d]/g, ""));
  return Number.isFinite(num) ? num : null;
}

export function pickLowestEarlyBirdCourse(courses: Course[]): EarlyBirdPick | null {
  let best: EarlyBirdPick | null = null;

  for (const course of courses) {
    const earlyBird = course.pricing?.earlyBird;
    if (!earlyBird) continue;
    const value = parseMoneyAmountToNumber(earlyBird.amount);
    if (value === null) continue;

    if (!best) {
      best = { course, earlyBird };
      continue;
    }

    const bestValue = parseMoneyAmountToNumber(best.earlyBird.amount);
    if (bestValue === null || value < bestValue) {
      best = { course, earlyBird };
    }
  }

  return best;
}

export function EarlyBirdBanner({
  courses,
  className,
  onEnquire,
}: {
  courses: Course[];
  className?: string;
  onEnquire?: (course: Course) => void;
}) {
  const pick = pickLowestEarlyBirdCourse(courses);
  if (!pick) return null;

  const { course, earlyBird } = pick;

  const until =
    (course.batches?.length
      ? pickNextValidEarlyBirdBatch(course.batches)?.earlyBirdUntil?.trim()
      : undefined) || earlyBird.until?.trim();

  return (
    <section className={className}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-full rounded-xl bg-[#111114] px-8 py-7 shadow-[0_18px_60px_rgba(0,0,0,0.55)] sm:px-10 sm:py-8">
            <p className="font-sans text-base font-extrabold uppercase leading-snug tracking-[0.28em] text-accentGold antialiased sm:text-lg sm:font-black">
              Early bird available — don&apos;t miss out
            </p>
          </div>
          <div className="w-full rounded-xl bg-accentGold px-8 py-7 shadow-[0_18px_60px_rgba(0,0,0,0.35)] sm:px-10 sm:py-8">
            <EarlyBirdGoldStripHeadline
              amount={earlyBird.amount}
              standardAmount={course.pricing?.standard?.amount}
              until={until || "—"}
              courseTitle={course.title}
            />
          </div>

          <div className="mt-4 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={`/courses/${course.slug}`}
              className="inline-flex w-full items-center justify-center rounded-full border-2 border-accentGold bg-accentGold px-7 py-4 text-sm font-bold uppercase tracking-[0.16em] text-background transition hover:border-accentGold/90 hover:bg-accentGold/90 sm:w-auto"
            >
              View course
            </Link>
            <button
              type="button"
              onClick={() => onEnquire?.(course)}
              className="inline-flex w-full items-center justify-center rounded-full border-2 border-accentGold/80 bg-transparent px-7 py-4 text-sm font-bold uppercase tracking-[0.16em] text-accentGold transition hover:border-accentGold hover:bg-accentGold/10 sm:w-auto"
            >
              Enquire now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

