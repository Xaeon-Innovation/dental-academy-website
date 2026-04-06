import type { RegistrationFormData } from "@/lib/validations/registration";

export interface StudentProfile {
  uid: string;
  email: string;
  phone: string;
  normalizedEmail?: string;
  normalizedPhone?: string;
  loginEnabled?: boolean;
  approvedAt?: Date;
  approvedByAdminUid?: string;
  /** Past delegate access (admin-verified). When true, allow materials access for legacyCourses. */
  legacyDelegate?: boolean;
  /** Course IDs the delegate attended previously (admin-verified). */
  legacyCourses?: string[];
  legacyApprovedAt?: Date;
  legacyApprovedByAdminUid?: string;
  displayName?: string;
  /** Last enrollment form data for prefilling future enrollments */
  savedFormSnapshot?: Partial<RegistrationFormData>;
  createdAt?: Date;
  updatedAt?: Date;
}

export type StudentProfileCreatePayload = Omit<StudentProfile, "createdAt" | "updatedAt"> & {
  createdAt?: Date;
  updatedAt?: Date;
};

export type StudentProfileUpdatePayload = Partial<
  Omit<StudentProfile, "uid" | "createdAt" | "updatedAt">
>;
