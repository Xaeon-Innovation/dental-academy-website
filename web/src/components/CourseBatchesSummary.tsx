"use client";

import { useMemo } from "react";
import type { CourseBatch } from "@/types/course";
import { Calendar, Clock, MapPin } from "lucide-react";
import { isEarlyBirdUntilValid } from "@/lib/early-bird";

export function CourseBatchesSummary({
  batches,
  fallbackDuration,
  fallbackLocation,
}: {
  batches: CourseBatch[];
  fallbackDuration?: string;
  fallbackLocation?: string;
}) {
  const rows = useMemo(() => batches ?? [], [batches]);

  if (!rows.length) return null;

  return (
    <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/55">
        Upcoming cohorts
      </p>
      <ul className="mt-3 space-y-3">
        {rows.map((b) => {
          const duration = (b.duration || fallbackDuration || "").trim();
          const location = (b.location || fallbackLocation || "").trim();
          return (
            <li key={b.id} className="rounded-lg border border-white/10 bg-black/25 p-3">
              <p className="text-sm font-semibold text-white">{b.label}</p>
              <div className="mt-2 space-y-1.5 text-sm text-white/75">
                <div className="flex items-start gap-2">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-accentGold/80" aria-hidden />
                  <span>{b.dateRange}</span>
                </div>
                {duration ? (
                  <div className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accentGold/80" aria-hidden />
                    <span>{duration}</span>
                  </div>
                ) : null}
                {location ? (
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accentGold/80" aria-hidden />
                    <span className="leading-relaxed">{location}</span>
                  </div>
                ) : null}
                {b.earlyBirdUntil && isEarlyBirdUntilValid(b.earlyBirdUntil) ? (
                  <p className="pt-1 text-xs text-accentGold/90">Early Bird until {b.earlyBirdUntil}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-white/55">
        Use the enquiry form to choose the cohort you want — we will confirm availability with you.
      </p>
    </div>
  );
}
