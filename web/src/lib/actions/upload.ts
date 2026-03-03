"use server";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { put } from "@vercel/blob";

type UploadResult = { success: true; url: string } | { success: false; error: string };

function validateImageFile(file: File): UploadResult | null {
  if (!file.type.startsWith("image/")) {
    return { success: false, error: "File must be an image" };
  }
  return null;
}

/**
 * Upload to Vercel Blob when BLOB_READ_WRITE_TOKEN is set (e.g. on Vercel).
 * Returns a public URL so the image is served from Blob, not from the server filesystem.
 */
async function uploadToBlob(
  file: File,
  pathPrefix: string
): Promise<UploadResult> {
  const invalid = validateImageFile(file);
  if (invalid) return invalid;

  const lastDot = file.name.lastIndexOf(".");
  const baseName = lastDot >= 0 ? file.name.slice(0, lastDot) : file.name;
  const ext = (lastDot >= 0 ? file.name.slice(lastDot + 1) : "jpg").toLowerCase();
  const safeName = baseName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const pathname = `${pathPrefix}/${Date.now()}_${safeName}.${ext}`;

  try {
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return { success: true, url: blob.url };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to upload image";
    console.error("Blob upload error:", err);
    return { success: false, error: message };
  }
}

async function saveImageToPublicFolder(
  file: File,
  subdirectory: string
): Promise<UploadResult> {
  const invalid = validateImageFile(file);
  if (invalid) return invalid;

  try {
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
 * Upload instructor image.
 * On Vercel (when BLOB_READ_WRITE_TOKEN is set) uses Vercel Blob; otherwise saves to public/images/instructors/.
 */
export async function uploadInstructorImage(file: File): Promise<UploadResult> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return uploadToBlob(file, "instructors");
  }
  return saveImageToPublicFolder(file, "instructors");
}

/**
 * Upload home page image (hero, CTA).
 * On Vercel uses Vercel Blob so the file is not read from the server filesystem (avoids ENOENT).
 */
export async function uploadHomeImage(file: File): Promise<UploadResult> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return uploadToBlob(file, "home");
  }
  return saveImageToPublicFolder(file, "home");
}

/**
 * Upload case image.
 * On Vercel uses Vercel Blob; otherwise saves to public/images/cases/.
 */
export async function uploadCaseImage(file: File): Promise<UploadResult> {
  try {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      return { success: false, error: "File must be an image" };
    }

    // Log file info for debugging
    console.log("Uploading case image:", {
      name: file.name,
      type: file.type,
      size: file.size,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      return await uploadToBlob(file, "cases");
    }
    return await saveImageToPublicFolder(file, "cases");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to upload image";
    console.error("Case image upload error:", err);
    return { success: false, error: message };
  }
}
