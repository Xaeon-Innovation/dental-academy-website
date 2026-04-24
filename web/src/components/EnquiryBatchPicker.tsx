"use client";

import { useMemo } from "react";
import type { CourseBatch } from "@/types/course";
import { isEarlyBirdUntilValid } from "@/lib/early-bird";

type Variant = "sidebar" | "inline";

export function EnquiryBatchPicker({
  batches,
  selectedBatchId,
  onSelectBatchId,
  courseDuration,
  courseLocation,
  variant = "inline",
}: {
  batches: CourseBatch[];
  selectedBatchId: string;
  onSelectBatchId: (id: string) => void;
  courseDuration?: string;
  courseLocation?: string;
  variant?: Variant;
}) {
  const options = useMemo(() => batches ?? [], [batches]);
  const selected = useMemo(
    () => options.find((b) => b.id === selectedBatchId) ?? null,
    [options, selectedBatchId]
  );

  const displayDuration = (selected?.duration || courseDuration || "").trim();
  const displayLocation = (selected?.location || courseLocation || "").trim();

  const labelClass =
    variant === "sidebar"
      ? "mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-white/60"
      : "mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-white/55";

  const selectClass =
    variant === "sidebar"
      ? "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-accentGold/50 focus:outline-none"
      : "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-accentGold/50 focus:outline-none";

  const detailBoxClass =
    variant === "sidebar"
      ? "mt-3 space-y-1 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/70"
      : "mt-3 space-y-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/75";

  return (
    <div className={variant === "sidebar" ? "mt-4" : "mt-0"}>
      <label className={labelClass}>Choose batch</label>
      <select
        value={selectedBatchId}
        onChange={(e) => onSelectBatchId(e.target.value)}
        aria-label="Choose batch"
        className={selectClass}
      >
        {options.map((b) => (
          <option key={b.id} value={b.id}>
            {b.label} — {b.dateRange}
          </option>
        ))}
      </select>
      {selected?.earlyBirdUntil && isEarlyBirdUntilValid(selected.earlyBirdUntil) ? (
        <p className={variant === "sidebar" ? "mt-2 text-xs text-accentGold/90" : "mt-2 text-xs text-accentGold"}>
          Early Bird until {selected.earlyBirdUntil}
        </p>
      ) : null}
      {selected ? (
        <div className={detailBoxClass}>
          <p>
            <span className="text-white/50">Dates: </span>
            <span className="text-white/85">{selected.dateRange}</span>
          </p>
          {displayDuration ? (
            <p>
              <span className="text-white/50">Duration: </span>
              <span className="text-white/85">{displayDuration}</span>
            </p>
          ) : null}
          {displayLocation ? (
            <p>
              <span className="text-white/50">Location: </span>
              <span className="text-white/85">{displayLocation}</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
