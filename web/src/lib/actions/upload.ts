"use server";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

/**
 * Upload instructor image to public folder
 * This saves the image to public/images/instructors/ directory
 */
export async function uploadInstructorImage(
  file: File
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      return { success: false, error: "File must be an image" };
    }

    // Validate file size (max 2MB for Firestore compatibility)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return { success: false, error: "Image size must be less than 2MB" };
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}_${sanitizedName}`;
    
    // Determine file extension
    const extension = file.name.split(".").pop() || "jpg";
    const fullFileName = `${fileName}.${extension}`;

    // Path to public/images/instructors directory
    const publicDir = join(process.cwd(), "public", "images", "instructors");
    
    // Ensure directory exists
    try {
      await mkdir(publicDir, { recursive: true });
    } catch (err) {
      // Directory might already exist, that's fine
    }

    // Write file
    const filePath = join(publicDir, fullFileName);
    await writeFile(filePath, buffer);

    // Return relative URL path
    const url = `/images/instructors/${fullFileName}`;

    return { success: true, url };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to upload image";
    console.error("Upload error:", err);
    return { success: false, error: message };
  }
}
