import { z } from "zod";

export const legacyAccessRequestSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("A valid email is required"),
  phone: z.string().min(6, "Phone number is required"),
  requestedCourseIds: z.array(z.string().min(1)).min(1, "Select at least one course"),
});

export type LegacyAccessRequestInput = z.infer<typeof legacyAccessRequestSchema>;

export const legacyAccessUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["new", "approved", "rejected"]),
  notes: z.string().max(5000).optional(),
  adminIdToken: z.string().min(1),
});

export const legacyAccessDecisionSchema = z.object({
  id: z.string().min(1),
  decision: z.enum(["approve", "reject"]),
  notes: z.string().max(5000).optional(),
  adminIdToken: z.string().min(1),
});

export type LegacyAccessUpdateInput = z.infer<typeof legacyAccessUpdateSchema>;
export type LegacyAccessDecisionInput = z.infer<typeof legacyAccessDecisionSchema>;

