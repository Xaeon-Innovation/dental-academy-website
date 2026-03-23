"use client";

import { NumberTicker } from "@/components/ui/number-ticker";

export type AboutStatItem = {
  value: number;
  suffix: string;
  label: string;
  decimalPlaces?: number;
  delay?: number;
};

type AboutStatisticsProps = {
  stats: AboutStatItem[];
};

export function AboutStatistics({ stats }: AboutStatisticsProps) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:justify-between md:gap-8">
      {stats.map(({ value, suffix, label, decimalPlaces = 0, delay = 0 }) => (
        <div key={label} className="text-center md:text-left">
          <div className="mx-auto h-px w-12 bg-accentGold md:mx-0" aria-hidden />
          <p className="mt-3 font-[var(--font-playfair)] text-3xl font-semibold tracking-tight text-white md:text-4xl">
            <span className="inline-flex items-baseline gap-0">
              <NumberTicker
                value={value}
                decimalPlaces={decimalPlaces}
                delay={delay}
                className="font-inherit text-inherit tabular-nums tracking-wider"
              />
              {suffix ? (
                <span className="font-inherit text-inherit">{suffix}</span>
              ) : null}
            </span>
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}
