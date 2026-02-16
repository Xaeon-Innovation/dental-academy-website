export type CategoryType = "blog" | "course";

export interface Category {
  id: string;
  name: string;
  slug: string;
  type?: CategoryType;
  order?: number;
}

export type CategoryCreatePayload = Omit<Category, "id"> & { id?: never };
