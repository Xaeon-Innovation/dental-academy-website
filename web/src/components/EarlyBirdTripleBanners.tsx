"use client";

import Link from "next/link";
import type { Course } from "@/types/course";
import { pickNextValidEarlyBirdBatch } from "@/lib/early-bird";
import { EarlyBirdGoldStripHeadline } from "@/components/EarlyBirdGoldStripHeadline";

type CoursePick = {
  title: string;
  slug: string;
  amount: string;
  standardAmount: string;
  until: string;
};

function pickBySlug(courses: Course[], slug: string): CoursePick | null {
  const c = courses.find((x) => x.slug === slug && x.status === "open");
  const amount = c?.pricing?.earlyBird?.amount;
  if (!c || !amount) return null;

  const validBatch = pickNextValidEarlyBirdBatch(c.batches);
  const until = validBatch?.earlyBirdUntil?.trim() || "";
  if (!until) return null;

  const standardAmount = c.pricing?.standard?.amount?.trim() ?? "";

  return { title: c.title, slug: c.slug, amount, standardAmount, until };
}

export function EarlyBirdTripleBanners({
  courses,
  className,
}: {
  courses: Course[];
  className?: string;
}) {
  const iplace = pickBySlug(courses, "iplace-irestore");
  const fullArch = pickBySlug(courses, "full-arch-intensive");

  if (!iplace && !fullArch) return null;

  return (
    <section className={className}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-full rounded-xl bg-[#111114] px-8 py-7 shadow-[0_18px_60px_rgba(0,0,0,0.55)] sm:px-10 sm:py-8">
            <p className="font-sans text-base font-extrabold uppercase leading-snug tracking-[0.28em] text-accentGold antialiased sm:text-lg sm:font-black">
              Early Bird Available, Don&apos;t miss out
            </p>
          </div>

          {iplace ? (
            <div className="flex w-full flex-col gap-4 rounded-xl bg-accentGold px-8 py-7 shadow-[0_18px_60px_rgba(0,0,0,0.35)] sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-8 sm:text-left">
              <EarlyBirdGoldStripHeadline
                amount={iplace.amount}
                standardAmount={iplace.standardAmount}
                until={iplace.until}
                courseTitle={iplace.title}
              />
              <Link
                href={`/courses/${iplace.slug}`}
                className="inline-flex items-center justify-center rounded-full border border-background/30 bg-background/10 px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-background transition hover:bg-background/15"
              >
                View
              </Link>
            </div>
          ) : null}

          {fullArch ? (
            <div className="flex w-full flex-col gap-4 rounded-xl bg-accentGold px-8 py-7 shadow-[0_18px_60px_rgba(0,0,0,0.35)] sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-8 sm:text-left">
              <EarlyBirdGoldStripHeadline
                amount={fullArch.amount}
                standardAmount={fullArch.standardAmount}
                until={fullArch.until}
                courseTitle={fullArch.title}
              />
              <Link
                href={`/courses/${fullArch.slug}`}
                className="inline-flex items-center justify-center rounded-full border border-background/30 bg-background/10 px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-background transition hover:bg-background/15"
              >
                View
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

