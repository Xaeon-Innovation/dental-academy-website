import { z } from "zod";

// Preprocess to normalize paths and empty strings
const preprocessImageUrl = z.preprocess(
  (val) => {
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed === "") return undefined;
      
      // Convert Windows paths to web paths
      // e.g., "web\public\images\instructors\photo.png" -> "/images/instructors/photo.png"
      let normalized = trimmed.replace(/\\/g, "/"); // Replace backslashes with forward slashes
      
      // Remove "web/public" or "public" prefix if present
      normalized = normalized.replace(/^(web\/)?public\//i, "");
      
      // Ensure it starts with /
      if (!normalized.startsWith("/") && !normalized.startsWith("http")) {
        normalized = "/" + normalized;
      }
      
      return normalized;
    }
    return val;
  },
  z
    .string()
    .refine(
      (val) => {
        // Allow relative paths starting with /
        if (val.startsWith("/")) return true;
        // Allow full URLs
        if (val.startsWith("http://") || val.startsWith("https://")) {
          try {
            new URL(val);
            return true;
          } catch {
            return false;
          }
        }
        return false;
      },
      {
        message: "Must be a valid URL or a relative path starting with /",
      }
    )
    .optional()
);

const visibleOnSchema = z.array(
  z.enum(["home", "about", "courses"])
).optional();

export const instructorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  credentials: z.string().min(1, "Credentials are required"),
  bio: z.string().min(1, "Bio is required"),
  badges: z.array(z.string()).default([]),
  imageUrl: preprocessImageUrl,
  visibleOn: visibleOnSchema,
});

export type InstructorFormData = z.infer<typeof instructorSchema>;
