import { z } from "zod";

export const enquirySubmitSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("A valid email is required"),
  phone: z.string().min(6, "Phone number is required"),
  countryCode: z.string().max(8).optional(),
  interestedCourseSlug: z.string().optional(),
  interestedCourseId: z.string().optional(),
  message: z.string().max(3000).optional(),
  utm: z
    .object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
      term: z.string().optional(),
      content: z.string().optional(),
    })
    .optional(),
});

export const enquiryUpdateSchema = z.object({
  id: z.string().min(1),
  status: z
    .enum(["new", "contacted", "qualified", "invited", "converted", "lost"])
    .optional(),
  assignedToAdminUid: z.string().optional(),
  notes: z.string().max(5000).optional(),
});

export const adminActivateEnquirySchema = z.object({
  enquiryId: z.string().min(1),
  courseId: z.string().min(1, "Course is required"),
  adminIdToken: z.string().min(1),
});

export const portalEmailPhoneLoginSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(6),
});

export type EnquirySubmitInput = z.infer<typeof enquirySubmitSchema>;
export type EnquiryUpdateInput = z.infer<typeof enquiryUpdateSchema>;
export type AdminActivateEnquiryInput = z.infer<typeof adminActivateEnquirySchema>;
export type PortalEmailPhoneLoginInput = z.infer<typeof portalEmailPhoneLoginSchema>;
