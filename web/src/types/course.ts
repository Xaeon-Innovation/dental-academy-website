export type CourseAgendaDay = {
  day: string;
  date: string;
  title: string;
  time: string;
  items: string[];
};

export type CourseInstructor = {
  name: string;
  credentials: string;
  bio: string;
  badges: string[];
  imageUrl?: string;
};

export type CoursePricing = {
  currency?: "EUR" | "EGP" | "USD";
  earlyBird?: {
    amount: string;
    /** Omitted when early-bird cutoff is only on `batches[].earlyBirdUntil`. */
    until?: string;
  };
  standard: {
    amount: string;
    from: string;
  };
  singleOccupancyUpgrade?: string;
};

export type CourseBatch = {
  id: string;
  label: string;
  dateRange: string;
  duration?: string;
  location?: string;
  /** Batch-specific early bird cutoff (hide when expired). */
  earlyBirdUntil?: string;
  /** When set, public course page shows this cohort’s agenda instead of `Course.agenda`. */
  agenda?: CourseAgendaDay[];
};

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  cpd?: string;
  provider?: string;
  status: "open" | "closed";
  order?: number;
  // Course details
  overview?: string[];
  learningPoints?: string[];
  agenda?: CourseAgendaDay[];
  requirements?: string[];
  instructor?: CourseInstructor;
  instructors?: CourseInstructor[];
  registrationBadge?: string;
  duration?: string;
  location?: string;
  maxParticipants?: number;
  dateRange?: string;
  batches?: CourseBatch[];
  pricing?: CoursePricing;
  packageIncludes?: string[];
  relatedCourseSlugs?: string[];
  // Legacy fields
  track?: string;
  level?: string;
  imageUrl?: string;
  /** Card layout/thumbnail image (courses listing). Shown with left-to-right gradient. */
  layoutImageUrl?: string;
  dates?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type CourseCreatePayload = Omit<
  Course,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: never;
  createdAt?: Date;
  updatedAt?: Date;
};

export type CourseUpdatePayload = Partial<CourseCreatePayload> & {
  id: string;
};
