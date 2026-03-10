import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { put } from "@vercel/blob";
import { addLogoWatermark } from "@/lib/imageWatermark";

export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds for large files

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "File must be an image" },
        { status: 400 }
      );
    }

    // On Vercel, case images must use Blob (filesystem is not persistent)
    if (process.env.VERCEL && !process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Case images require Vercel Blob in production. Add BLOB_READ_WRITE_TOKEN in your Vercel project settings.",
        },
        { status: 503 }
      );
    }

    const bytes = await file.arrayBuffer();
    const originalBuffer = Buffer.from(bytes);
    const watermarkedBuffer = await addLogoWatermark(originalBuffer);

    const timestamp = Date.now();
    const lastDot = file.name.lastIndexOf(".");
    const baseName = lastDot >= 0 ? file.name.slice(0, lastDot) : file.name;
    const ext = "jpg";
    const safeName = baseName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}_${safeName}.${ext}`;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const pathname = `cases/${fileName}`;

        const blob = await put(pathname, watermarkedBuffer, {
          access: "public",
          addRandomSuffix: true,
        });

        return NextResponse.json({ success: true, url: blob.url });
      } catch (err) {
        console.error("Blob upload error:", err);
        const message = err instanceof Error ? err.message : "Failed to upload to blob";
        return NextResponse.json(
          { success: false, error: message },
          { status: 500 }
        );
      }
    }

    // Local dev only: fallback to filesystem
    try {
      const publicDir = join(process.cwd(), "public", "images", "cases");

      try {
        await mkdir(publicDir, { recursive: true });
      } catch {
        // directory may already exist
      }

      const filePath = join(publicDir, fileName);
      await writeFile(filePath, watermarkedBuffer);

      const url = `/images/cases/${fileName}`;
      return NextResponse.json({ success: true, url });
    } catch (err) {
      console.error("File system upload error:", err);
      const message = err instanceof Error ? err.message : "Failed to save file";
      return NextResponse.json(
        { success: false, error: message },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Upload route error:", err);
    const message = err instanceof Error ? err.message : "Failed to process upload";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
