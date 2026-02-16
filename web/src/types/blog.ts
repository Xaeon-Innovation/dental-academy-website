export type BlogPostStatus = "draft" | "published" | "archived";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  author?: string;
  imageUrl?: string;
  categoryId?: string;
  status?: BlogPostStatus;
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type BlogPostCreatePayload = Omit<
  BlogPost,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: never;
  createdAt?: Date;
  updatedAt?: Date;
};
