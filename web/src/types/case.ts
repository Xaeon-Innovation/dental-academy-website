export interface Case {
  id: string;
  title: string;
  description?: string;
  images: string[]; // Array of image URLs
  primaryImageIndex: number; // Index of the primary/thumbnail image (defaults to 0)
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CaseCreatePayload = Omit<Case, "id" | "createdAt" | "updatedAt"> & {
  id?: never;
  createdAt?: Date;
  updatedAt?: Date;
};

export type CaseUpdatePayload = Partial<CaseCreatePayload> & {
  id: string;
};
