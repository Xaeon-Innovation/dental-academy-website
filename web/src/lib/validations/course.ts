import { z } from "zod";

const courseAgendaDaySchema = z.object({
  day: z.string().min(1, "Day is required"),
  date: z.string().min(1, "Date is required"),
  title: z.string().min(1, "Title is required"),
  time: z.string().min(1, "Time is required"),
  items: z.array(z.string().min(1, "Item cannot be empty")).min(1, "At least one item is required"),
});

const courseInstructorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  credentials: z.string().min(1, "Credentials are required"),
  bio: z.string().min(1, "Bio is required"),
  badges: z.array(z.string()).default([]),
  imageUrl: z.string().optional(),
});

const coursePricingSchema = z.object({
  currency: z.enum(["EUR", "EGP", "USD"]).optional(),
  earlyBird: z
    .object({
      amount: z.string().min(1, "Amount is required"),
      until: z.string().min(1, "Until date is required"),
    })
    .optional(),
  standard: z.object({
    amount: z.string().min(1, "Standard amount is required"),
    from: z.string().min(1, "From date is required"),
  }),
  singleOccupancyUpgrade: z.string().optional(),
});

export const courseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  description: z.string().min(1, "Description is required"),
  cpd: z.string().optional(),
  provider: z.string().optional(),
  status: z.enum(["open", "closed"], {
    message: "Status is required",
  }),
  order: z.number().int().min(0).optional(),
  overview: z.array(z.string().min(1, "Overview paragraph cannot be empty")).optional(),
  learningPoints: z.array(z.string().min(1, "Learning point cannot be empty")).optional(),
  agenda: z.array(courseAgendaDaySchema).optional(),
  requirements: z.array(z.string()).optional(),
  instructor: courseInstructorSchema.optional(),
  instructors: z.array(courseInstructorSchema).optional(),
  registrationBadge: z.string().optional(),
  duration: z.string().optional(),
  location: z.string().optional(),
  maxParticipants: z.number().int().min(1).optional(),
  dateRange: z.string().optional(),
  pricing: coursePricingSchema.optional(),
  packageIncludes: z.array(z.string().min(1, "Package item cannot be empty")).optional(),
  relatedCourseSlugs: z.array(z.string()).optional(),
  track: z.string().optional(),
  level: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  // Accept empty, relative paths (/images/courses/... from device uploads), or full URLs (order matters: check path before .url())
  layoutImageUrl: z
    .union([
      z.literal(""),
      z.string().min(1).regex(/^\//),
      z.string().url(),
    ])
    .optional(),
  dates: z.array(z.string()).optional(),
});

export type CourseFormData = z.infer<typeof courseSchema>;
