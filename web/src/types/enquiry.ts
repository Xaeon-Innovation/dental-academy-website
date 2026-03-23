export type EnquiryStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "invited"
  | "converted"
  | "lost";

export interface EnquiryUtm {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface Enquiry {
  id: string;
  fullName: string;
  email: string;
  normalizedEmail?: string;
  phone: string;
  normalizedPhone?: string;
  countryCode?: string;
  interestedCourseSlug?: string;
  interestedCourseId?: string;
  message?: string;
  utm?: EnquiryUtm;
  status: EnquiryStatus;
  assignedToAdminUid?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  invitedAt?: Date;
  convertedAt?: Date;
  linkedUserId?: string;
  linkedRegistrationId?: string;
}

export type EnquiryCreatePayload = Omit<
  Enquiry,
  "id" | "createdAt" | "updatedAt" | "status"
> & {
  id?: never;
};
