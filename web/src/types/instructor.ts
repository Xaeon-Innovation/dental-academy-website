export interface Instructor {
  id: string;
  name: string;
  credentials: string;
  bio: string;
  badges: string[];
  imageUrl?: string;
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
