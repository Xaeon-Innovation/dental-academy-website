export type InstructorPageVisibility = "home" | "about" | "courses";

export const INSTRUCTOR_PAGE_KEYS: InstructorPageVisibility[] = [
  "home",
  "about",
  "courses",
];

export interface Instructor {
  id: string;
  name: string;
  credentials: string;
  bio: string;
  badges: string[];
  imageUrl?: string;
  /** Pages where this instructor is shown. Undefined or empty = show on all pages (backward compat). */
  visibleOn?: InstructorPageVisibility[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type InstructorCreatePayload = Omit<
  Instructor,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: never;
  createdAt?: Date;
  updatedAt?: Date;
};

export type InstructorUpdatePayload = Partial<InstructorCreatePayload> & {
  id: string;
};
