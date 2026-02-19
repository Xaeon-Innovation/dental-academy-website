import type { RegistrationFormData } from "@/lib/validations/registration";

export interface StudentProfile {
  uid: string;
  email: string;
  phone: string;
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
