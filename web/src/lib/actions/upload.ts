"use server";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

type UploadResult = { success: true; url: string } | { success: false; error: string };

async function saveImageToPublicFolder(
  file: File,
  subdirectory: string
): Promise<UploadResult> {
  try {
    if (!file.type.startsWith("image/")) {
      return { success: false, error: "File must be an image" };
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: "Image size must be less than 2MB" };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const lastDot = file.name.lastIndexOf(".");
    const baseName = lastDot >= 0 ? file.name.slice(0, lastDot) : file.name;
    const originalExt = (lastDot >= 0 ? file.name.slice(lastDot + 1) : "jpg").toLowerCase();
    const sanitizedBase = baseName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fullFileName = `${timestamp}_${sanitizedBase}.${originalExt}`;

    const publicDir = join(process.cwd(), "public", "images", subdirectory);

    try {
      await mkdir(publicDir, { recursive: true });
    } catch {
      // directory may already exist
    }

    const filePath = join(publicDir, fullFileName);
    await writeFile(filePath, buffer);

    const url = `/images/${subdirectory}/${fullFileName}`;
    return { success: true, url };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to upload image";
    console.error("Upload error:", err);
    return { success: false, error: message };
  }
}

/**
 * Upload instructor image to public folder
 * This saves the image to public/images/instructors/ directory
 */
export async function uploadInstructorImage(file: File): Promise<UploadResult> {
  return saveImageToPublicFolder(file, "instructors");
}

/**
 * Upload home page image to public folder
 * This saves the image to public/images/home/ directory
 */
export async function uploadHomeImage(file: File): Promise<UploadResult> {
  return saveImageToPublicFolder(file, "home");
}
