export type TestimonialStatus = "approved" | "pending";

export interface Testimonial {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  quote: string;
  displayName?: string;
  status: TestimonialStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TestimonialCreatePayload = Omit<
  Testimonial,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: never;
  createdAt?: Date;
  updatedAt?: Date;
};

export type TestimonialUpdatePayload = Partial<
  Pick<Testimonial, "rating" | "quote" | "displayName" | "status">
>;

export type TestimonialDisplayItem = {
  name: string;
  rating: number;
  quote: string;
};
