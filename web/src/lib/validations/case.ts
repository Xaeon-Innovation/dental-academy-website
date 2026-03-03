import { z } from "zod";

// Custom URL validator that accepts both absolute URLs and relative paths
const urlOrPathSchema = z.string().min(1).refine(
  (val) => {
    // Accept absolute URLs (http://, https://)
    if (val.startsWith("http://") || val.startsWith("https://")) {
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    }
    // Accept relative paths starting with /
    if (val.startsWith("/")) {
      return true;
    }
    return false;
  },
  {
    message: "Image URL must be a valid URL or path starting with /",
  }
);

export const caseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  imageUrl: urlOrPathSchema.optional(), // Legacy field
  imageUrls: z.array(urlOrPathSchema).optional(),
  order: z.number().int().min(0).optional(),
}).refine(
  (data) => {
    // Either imageUrl (legacy) or imageUrls must be provided with at least one valid URL
    const hasLegacyImage = !!data.imageUrl && data.imageUrl.trim().length > 0;
    const hasImageUrls = !!data.imageUrls && Array.isArray(data.imageUrls) && data.imageUrls.length > 0 && data.imageUrls.every(url => url && url.trim().length > 0);
    return hasLegacyImage || hasImageUrls;
  },
  {
    message: "At least one image is required",
    path: ["imageUrls"],
  }
);

export type CaseFormData = z.infer<typeof caseSchema>;
