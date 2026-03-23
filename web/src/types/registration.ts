export type RegistrationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export type PaymentStatus = "unpaid" | "paid" | "failed" | "refunded";

export type SpecialRequestStatus = "pending" | "priced" | "declined";

export interface SpecialRequest {
  description: string;
  requestedAt: Date;
  status: SpecialRequestStatus;
}

export type PrimaryWorkSetting =
  | "NHS"
  | "Private"
  | "Mixed"
  | "Hospital/Academic"
  | "Other";

export type PreferredFormat = "hands-on" | "mixed";

export const ASPECTS_TO_DEVELOP = [
  "Surgical placement (basic)",
  "Advanced surgery (grafting, GBR, etc.)",
  "Restorative workflows",
  "Fully guided digital surgery",
  "Soft tissue management",
  "CBCT / planning",
  "Patient communication and case acceptance",
] as const;

export type AspectToDevelop = (typeof ASPECTS_TO_DEVELOP)[number];

export interface Registration {
  id: string;
  userId?: string;
  courseId: string;
  courseSlug?: string;
  email: string;
  name: string;
  phone?: string;
  status: RegistrationStatus;
  // Personal
  country: string;
  instagramHandle?: string;
  // Professional
  currentRole: string;
  yearsExperience?: number;
  primaryWorkSetting?: PrimaryWorkSetting;
  gdcNumber?: string;
  // Implant experience
  hasPlacedImplants: boolean;
  implantsPlacedCount?: number;
  hasRestoredCases: boolean;
  aspectsToDevelop: string[];
  // Preferences
  preferredFormat?: PreferredFormat;
  howDidYouHear?: string;
  whatAttractedYou?: string;
  // Final
  contactByWhatsApp: boolean;
  consentContact: boolean;
  /** Student chose single occupancy upgrade (adds pricing.singleOccupancyUpgrade to total) */
  singleOccupancyUpgrade?: boolean;
  // Payment (Stripe)
  /** Total amount to pay in smallest currency unit (e.g. pence). Set from course pricing + optional extra fees. */
  amountDueCents?: number;
  paymentStatus?: PaymentStatus;
  stripePaymentIntentId?: string;
  paidAt?: Date;
  // Special request (delegate requests something; admin sets extra fee)
  specialRequest?: SpecialRequest;
  /** Admin-set extra fees in smallest currency unit (e.g. pence). */
  extraFeesCents?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RegistrationCreatePayload = Omit<
  Registration,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: never;
  createdAt?: Date;
  updatedAt?: Date;
};
