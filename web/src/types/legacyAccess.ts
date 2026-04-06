export type LegacyAccessRequestStatus = "new" | "approved" | "rejected";

export interface LegacyAccessRequest {
  id: string;
  fullName: string;
  email: string;
  normalizedEmail?: string;
  phone: string;
  normalizedPhone?: string;
  requestedCourseIds: string[];
  status: LegacyAccessRequestStatus;
  notes?: string;
  approvedAt?: Date;
  approvedByAdminUid?: string;
  rejectedAt?: Date;
  rejectedByAdminUid?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

