import type { CourseBatch } from "@/types/course";

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

function todayUtcInTimeZone(timeZone: string): Date {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(new Date());
  const y = Number(parts.find((p) => p.type === "year")?.value ?? "1970");
  const m = Number(parts.find((p) => p.type === "month")?.value ?? "01");
  const d = Number(parts.find((p) => p.type === "day")?.value ?? "01");
  return new Date(Date.UTC(y, m - 1, d));
}

export function parseDayMonthYearToUtcDate(input: string): Date | null {
  const s = input.trim();
  if (!s) return null;

  // Accept common format like "31 March 2026" or "1 July 2026"
  const m = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const monthName = m[2].toLowerCase();
  const year = Number(m[3]);
  const month = MONTHS[monthName];
  if (!Number.isFinite(day) || !Number.isFinite(year) || month === undefined) return null;
  return new Date(Date.UTC(year, month, day));
}

export function isEarlyBirdUntilValid(until: string, timeZone = "Europe/London"): boolean {
  const cutoff = parseDayMonthYearToUtcDate(until);
  if (!cutoff) return false;
  const today = todayUtcInTimeZone(timeZone);
  // Valid through cutoff day (inclusive).
  return today.getTime() <= cutoff.getTime();
}

export function pickNextValidEarlyBirdBatch(
  batches: CourseBatch[] | undefined,
  timeZone = "Europe/London"
): CourseBatch | null {
  const list = (batches ?? [])
    .filter((b) => b.earlyBirdUntil && isEarlyBirdUntilValid(b.earlyBirdUntil, timeZone))
    .slice()
    .sort((a, b) => {
      const da = parseDayMonthYearToUtcDate(a.earlyBirdUntil ?? "")?.getTime() ?? Infinity;
      const db = parseDayMonthYearToUtcDate(b.earlyBirdUntil ?? "")?.getTime() ?? Infinity;
      return da - db;
    });
  return list[0] ?? null;
}

