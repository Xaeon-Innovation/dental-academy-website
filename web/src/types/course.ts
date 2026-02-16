export interface Course {
  id: string;
  title: string;
  slug: string;
  track?: string;
  level?: string;
  description: string;
  imageUrl?: string;
  dates?: string[];
  order?: number;
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
