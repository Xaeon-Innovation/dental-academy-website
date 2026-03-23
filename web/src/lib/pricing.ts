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

/** Line-item breakdown for display to admin and delegate: early bird/standard, single occupancy, special request, total. */
export type RegistrationTotalBreakdown = {
  earlyBird: string;
  standard: string;
  singleOccupancy: string;
  specialRequest: string;
  total: string;
  totalCents: number;
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

/**
 * Base amount in smallest currency unit (cents/pence) for a registration from course pricing only.
 * Uses same logic as computeRegistrationTotal (early bird, single occupancy). Returns 0 when course has no pricing.
 */
export function getBaseAmountCents(
  registration: Pick<Registration, "createdAt" | "singleOccupancyUpgrade">,
  course: Course | null | undefined
): number {
  const result = computeRegistrationTotal(registration, course);
  if (!result) return 0;
  return Math.round(result.total * 100);
}

/**
 * Full line-item breakdown for a registration: early bird (or standard), single occupancy, special request, total.
 * Use for admin and delegate total display. Empty string means that line does not apply.
 */
export function getRegistrationTotalBreakdown(
  registration: Pick<
    Registration,
    "createdAt" | "singleOccupancyUpgrade" | "amountDueCents" | "extraFeesCents"
  >,
  course: Course | null | undefined
): RegistrationTotalBreakdown | null {
  const pricing = course?.pricing;
  if (!pricing?.standard?.amount) {
    const extraCents = registration.extraFeesCents ?? 0;
    if (extraCents <= 0) return null;
    return {
      earlyBird: "",
      standard: "",
      singleOccupancy: "",
      specialRequest: formatPrice(extraCents / 100),
      total: formatPrice(extraCents / 100),
      totalCents: extraCents,
    };
  }

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
  const baseAmount = parsePriceAmount(baseAmountStr);
  const earlyBirdFormatted = useEarlyBird ? formatPrice(baseAmount) : "";
  const standardFormatted = !useEarlyBird ? formatPrice(baseAmount) : "";

  let singleOccupancyAmount = 0;
  if (
    registration.singleOccupancyUpgrade === true &&
    pricing.singleOccupancyUpgrade
  ) {
    singleOccupancyAmount = parsePriceAmount(pricing.singleOccupancyUpgrade);
  }
  const singleOccupancyFormatted =
    singleOccupancyAmount > 0 ? formatPrice(singleOccupancyAmount) : "";

  const extraCents = registration.extraFeesCents ?? 0;
  const specialRequestFormatted =
    extraCents > 0 ? formatPrice(extraCents / 100) : "";

  const baseCents = Math.round((baseAmount + singleOccupancyAmount) * 100);
  const totalCents =
    registration.amountDueCents ?? baseCents + extraCents;
  const totalFormatted = formatPrice(totalCents / 100);

  return {
    earlyBird: earlyBirdFormatted,
    standard: standardFormatted,
    singleOccupancy: singleOccupancyFormatted,
    specialRequest: specialRequestFormatted,
    total: totalFormatted,
    totalCents,
  };
}
