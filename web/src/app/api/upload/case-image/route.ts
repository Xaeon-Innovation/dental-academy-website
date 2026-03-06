import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { put } from "@vercel/blob";

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

    // Upload to Vercel Blob if token is available
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const lastDot = file.name.lastIndexOf(".");
        const baseName = lastDot >= 0 ? file.name.slice(0, lastDot) : file.name;
        const ext = (lastDot >= 0 ? file.name.slice(lastDot + 1) : "jpg").toLowerCase();
        const safeName = baseName.replace(/[^a-zA-Z0-9.-]/g, "_");
        const pathname = `cases/${Date.now()}_${safeName}.${ext}`;

        const blob = await put(pathname, file, {
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

    // Fallback to local file system
    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const timestamp = Date.now();
      const lastDot = file.name.lastIndexOf(".");
      const baseName = lastDot >= 0 ? file.name.slice(0, lastDot) : file.name;
      const originalExt = (lastDot >= 0 ? file.name.slice(lastDot + 1) : "jpg").toLowerCase();
      const sanitizedBase = baseName.replace(/[^a-zA-Z0-9.-]/g, "_");
      const fullFileName = `${timestamp}_${sanitizedBase}.${originalExt}`;

      const publicDir = join(process.cwd(), "public", "images", "cases");

      try {
        await mkdir(publicDir, { recursive: true });
      } catch {
        // directory may already exist
      }

      const filePath = join(publicDir, fullFileName);
      await writeFile(filePath, buffer);

      const url = `/images/cases/${fullFileName}`;
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
