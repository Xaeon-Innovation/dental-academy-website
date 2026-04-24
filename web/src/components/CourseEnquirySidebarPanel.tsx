"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Check, MessageCircle } from "lucide-react";
import type { Course, CoursePricing } from "@/types/course";
import { CourseEnquiryFormSyncedToDetailBatch } from "@/components/CourseEnquiryFormSyncedToDetailBatch";
import { useCourseBatchSelection } from "@/contexts/CourseBatchContext";
import { isEarlyBirdUntilValid } from "@/lib/early-bird";

type Props = {
  courseId: string;
  courseSlug: string;
  pricing: CoursePricing;
  batches?: Course["batches"];
  packageIncludes?: string[];
  courseDuration?: string;
  courseLocation?: string;
};

export function CourseEnquirySidebarPanel({
  courseId,
  courseSlug,
  pricing,
  batches,
  packageIncludes,
  courseDuration,
  courseLocation,
}: Props) {
  const hasBatches = Boolean(batches?.length);
  const { batchId: selectedBatchId } = useCourseBatchSelection();

  const selectedBatch = useMemo(
    () => (hasBatches && batches ? batches.find((b) => b.id === selectedBatchId) ?? null : null),
    [batches, hasBatches, selectedBatchId]
  );

  const earlyAmount = pricing.earlyBird?.amount?.trim();
  const untilForDisplay = useMemo(() => {
    if (!earlyAmount) return "";
    if (hasBatches) {
      if (!selectedBatch) return "";
      return selectedBatch.earlyBirdUntil?.trim() || pricing.earlyBird?.until?.trim() || "";
    }
    return pricing.earlyBird?.until?.trim() || "";
  }, [earlyAmount, hasBatches, selectedBatch, pricing.earlyBird?.until]);

  const earlyBirdDateValid = Boolean(untilForDisplay && isEarlyBirdUntilValid(untilForDisplay));
  /** Full early-bird price row only while the cutoff is still valid (avoids showing a “dead” promo price). */
  const showEarlyBirdPromo = Boolean(earlyAmount && earlyBirdDateValid);
  /** Compact notice when an early-bird amount exists but the cohort / course cutoff has passed. */
  const showEarlyBirdEndedNotice = Boolean(earlyAmount && untilForDisplay && !earlyBirdDateValid);

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Total price</p>
      {showEarlyBirdPromo ? (
        <div className="mt-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="text-2xl font-semibold text-white">{pricing.earlyBird?.amount}</p>
            <span className="rounded-full border border-emerald-500/45 bg-emerald-500/15 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-300">
              Early bird
            </span>
          </div>
          {untilForDisplay ? (
            <p className="mt-1 text-xs text-white/60">
              Until {untilForDisplay}
              {hasBatches && selectedBatch?.label ? (
                <span className="text-white/45"> · {selectedBatch.label}</span>
              ) : null}
            </p>
          ) : null}
        </div>
      ) : null}
      {showEarlyBirdEndedNotice ? (
        <div className="mt-2">
          <span className="inline-flex rounded-full border border-red-500/45 bg-red-500/15 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-red-300">
            Early bird unavailable
          </span>
          <p className="mt-1 text-xs text-white/50">
            Was until {untilForDisplay}
            {hasBatches && selectedBatch?.label ? (
              <span className="text-white/40"> · {selectedBatch.label}</span>
            ) : null}
          </p>
        </div>
      ) : earlyAmount && !untilForDisplay && hasBatches ? (
        <p className="mt-2 text-xs text-white/50">Early bird cutoff is set per cohort (choose batch below).</p>
      ) : null}

      <div className="mt-3">
        <p className="text-xl font-semibold text-white/90">{pricing.standard.amount}</p>
        <p className="mt-0.5 text-xs text-white/60">From {pricing.standard.from}</p>
      </div>
      {pricing.singleOccupancyUpgrade ? (
        <p className="mt-2 text-xs text-white/60">Single occupancy upgrade: +{pricing.singleOccupancyUpgrade}</p>
      ) : null}

      {packageIncludes && packageIncludes.length > 0 ? (
        <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.02] p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/70">Package includes:</p>
          <ul className="space-y-1.5">
            {packageIncludes.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-white/70">
                <Check className="h-3 w-3 shrink-0 text-accentGold/80" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <CourseEnquiryFormSyncedToDetailBatch
        courseSlug={courseSlug}
        courseId={courseId}
        batches={batches}
        courseDuration={courseDuration}
        courseLocation={courseLocation}
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
  );
}
