import type { Course, CoursePricing } from "@/types/course";
import type { Registration } from "@/types/registration";

const MONTH_NAMES: Record<string, number> = {
  january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2, april: 3, apr: 3,
  may: 4, june: 5, jun: 5, july: 6, jul: 6, august: 7, aug: 7, september: 8, sep: 8, sept: 8,
  october: 9, oct: 9, november: 10, nov: 10, december: 11, dec: 11,
};

/**
 * Parse a date string like "31 March 2026" or "1 April 2026". Tries ISO first, then "DD Month YYYY".
 */
export function parsePricingDate(str: string | undefined): Date | null {
  if (!str || typeof str !== "string") return null;
  const trimmed = str.trim();
  if (!trimmed) return null;
  const asDate = new Date(trimmed);
  if (!Number.isNaN(asDate.getTime())) return asDate;
  const match = trimmed.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/i);
  if (!match) return null;
  const [, day, monthStr, year] = match;
  const month = MONTH_NAMES[monthStr.toLowerCase()];
  if (month === undefined) return null;
  const y = parseInt(year, 10);
  const d = parseInt(day, 10);
  if (Number.isNaN(y) || Number.isNaN(d)) return null;
  const date = new Date(y, month, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Parse a price string like "£6,995" or "+£500" into a number. Returns 0 for missing/invalid.
 */
export function parsePriceAmount(str: string | undefined): number {
  if (!str || typeof str !== "string") return 0;
  const cleaned = str.replace(/[^\d.,]/g, "").replace(/,/g, "");
  if (!cleaned) return 0;
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Format a number as currency (e.g. 6995 -> "£6,995"). Uses £ as default.
 */
export function formatPrice(amount: number, currencySymbol = "£"): string {
  if (amount === 0) return `${currencySymbol}0`;
  const parts = Math.round(amount).toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${currencySymbol}${parts.join(".")}`;
}

export type RegistrationTotalResult = {
  total: number;
  formattedTotal: string;
  breakdown?: { basePrice: string; upgradePrice?: string };
};

/**
 * Compute total price for a registration based on course pricing:
 * - Base: early bird if enrollment date <= earlyBird.until, else standard.
 * - Add single occupancy upgrade if registration has it and course offers it.
 * Returns null when course has no pricing.
 */
export function computeRegistrationTotal(
  registration: Pick<Registration, "createdAt" | "singleOccupancyUpgrade">,
  course: Course | null | undefined
): RegistrationTotalResult | null {
  const pricing = course?.pricing;
  if (!pricing?.standard?.amount) return null;

  const untilDate = pricing.earlyBird?.until
    ? parsePricingDate(pricing.earlyBird.until)
    : null;
  const enrollmentDate = registration.createdAt
    ? new Date(registration.createdAt)
    : null;

  const useEarlyBird =
    untilDate &&
    enrollmentDate &&
    pricing.earlyBird?.amount &&
    enrollmentDate.getTime() <= untilDate.getTime();

  const baseAmountStr = useEarlyBird
    ? pricing.earlyBird!.amount
    : pricing.standard.amount;
  let total = parsePriceAmount(baseAmountStr);
  const baseFormatted = formatPrice(parsePriceAmount(baseAmountStr));

  let upgradeFormatted: string | undefined;
  if (
    registration.singleOccupancyUpgrade === true &&
    pricing.singleOccupancyUpgrade
  ) {
    const upgradeAmount = parsePriceAmount(pricing.singleOccupancyUpgrade);
    total += upgradeAmount;
    upgradeFormatted = formatPrice(upgradeAmount);
  }

  return {
    total,
    formattedTotal: formatPrice(total),
    breakdown: {
      basePrice: baseFormatted,
      ...(upgradeFormatted && { upgradePrice: upgradeFormatted }),
    },
  };
}
