import { z } from "zod";

// Custom URL validator that accepts both absolute and relative URLs
const urlOrPath = z.string().refine(
  (val) => {
    // Accept absolute URLs (http/https)
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
  { message: "Must be a valid URL or path starting with /" }
);

export const caseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().or(z.literal("")),
  images: z.array(urlOrPath).min(1, "At least one image is required"),
  primaryImageIndex: z.number().int().min(0),
});

export type CaseFormData = z.infer<typeof caseSchema>;
