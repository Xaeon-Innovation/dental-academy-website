import { z } from "zod";
import { ASPECTS_TO_DEVELOP } from "@/types/registration";

export const primaryWorkSettingEnum = z.enum([
  "NHS",
  "Private",
  "Mixed",
  "Hospital/Academic",
  "Other",
]);

export const preferredFormatEnum = z.enum(["hands-on", "mixed"]);

export const registrationSchema = z
  .object({
    // Course context (set by page)
    courseId: z.string().min(1, "Course is required"),
    courseSlug: z.string().min(1, "Course slug is required"),
    // Personal
    name: z.string().min(1, "Full name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(1, "Phone number is required"),
    country: z.string().min(1, "Country of residence is required"),
    instagramHandle: z.string().optional(),
    // Professional
    currentRole: z.string().min(1, "Current role is required"),
    yearsExperience: z.coerce.number().int().min(0).max(60).optional(),
    primaryWorkSetting: primaryWorkSettingEnum.optional(),
    gdcNumber: z.string().optional(),
    // Implant experience
    hasPlacedImplants: z.boolean(),
    implantsPlacedCount: z.coerce.number().int().min(0).optional(),
    hasRestoredCases: z.boolean(),
    aspectsToDevelop: z.array(z.string()).min(0),
    // Preferences
    preferredFormat: preferredFormatEnum.optional(),
    howDidYouHear: z.string().optional(),
    whatAttractedYou: z.string().optional(),
    enrollmentNote: z.string().max(2000, "Message is too long").optional(),
    // Final
    contactByWhatsApp: z.boolean(),
    consentContact: z.boolean(),
    acceptedTerms: z.boolean(),
    singleOccupancyUpgrade: z.boolean().optional(),
  })
  .refine((data) => data.consentContact === true, {
    message: "You must agree to be contacted with further details.",
    path: ["consentContact"],
  })
  .refine((data) => data.acceptedTerms === true, {
    message: "You must accept the Terms and Conditions to proceed.",
    path: ["acceptedTerms"],
  });

export type RegistrationFormData = z.infer<typeof registrationSchema>;

/** Bare-minimum enrollment from course page (requires verified Firebase session via idToken). */
export const minimalEnrollmentSchema = z
  .object({
    courseId: z.string().min(1, "Course is required"),
    courseSlug: z.string().min(1, "Course slug is required"),
    name: z.string().min(1, "Full name is required"),
    phone: z.string().min(1, "Phone number is required"),
    enrollmentNote: z.string().max(2000, "Message is too long").optional(),
    consentContact: z.boolean(),
    acceptedTerms: z.boolean(),
    idToken: z.string().min(1, "You must be signed in to enroll"),
  })
  .refine((data) => data.consentContact === true, {
    message: "You must agree to be contacted with further details.",
    path: ["consentContact"],
  })
  .refine((data) => data.acceptedTerms === true, {
    message: "You must accept the Terms and Conditions to proceed.",
    path: ["acceptedTerms"],
  });

export type MinimalEnrollmentFormData = z.infer<typeof minimalEnrollmentSchema>;

export const aspectsToDevelopOptions = ASPECTS_TO_DEVELOP;
