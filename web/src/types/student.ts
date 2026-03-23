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
