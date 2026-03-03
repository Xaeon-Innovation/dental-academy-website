export interface Case {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string; // Legacy field for backward compatibility
  imageUrls?: string[]; // New field for multiple images
  order?: number;
  createdAt?: Date | string; // Can be Date object or ISO string
  updatedAt?: Date | string; // Can be Date object or ISO string
}

export type CaseCreatePayload = Omit<Case, "id" | "createdAt" | "updatedAt">;

export type CaseUpdatePayload = Partial<CaseCreatePayload>;
