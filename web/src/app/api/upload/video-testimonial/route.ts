import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { put } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export const runtime = "nodejs";
export const maxDuration = 60;

const VIDEO_MIMES = ["video/mp4", "video/webm"];
const MAX_VIDEO_MB = 100;

function validateVideo(file: File): string | null {
  if (!VIDEO_MIMES.includes(file.type)) return "File must be MP4 or WebM";
  if (file.size > MAX_VIDEO_MB * 1024 * 1024) return `Video must be under ${MAX_VIDEO_MB}MB`;
  return null;
}

/** Client upload: browser sends file directly to Vercel Blob; we only issue a token (no 4.5MB limit). */
async function handleTokenRequest(request: NextRequest): Promise<NextResponse> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "Video testimonials require Vercel Blob. Add BLOB_READ_WRITE_TOKEN in your Vercel project settings.",
      },
      { status: 503 }
    );
  }
  const body = (await request.json()) as HandleUploadBody;
  const jsonResponse = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async (pathname) => {
      return {
        allowedContentTypes: VIDEO_MIMES,
        addRandomSuffix: true,
        maximumSizeInBytes: MAX_VIDEO_MB * 1024 * 1024,
      };
    },
    onUploadCompleted: async () => {
      // Optional: run logic after upload (e.g. notify). Client already has the URL.
    },
  });
  return NextResponse.json(jsonResponse);
}

/** Legacy FormData upload (for local dev when client upload is not used). */
async function handleFormDataUpload(request: NextRequest): Promise<NextResponse> {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
  }

  const invalid = validateVideo(file);
  if (invalid) {
    return NextResponse.json({ success: false, error: invalid }, { status: 400 });
  }

  if (process.env.VERCEL && !process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Video testimonials require Vercel Blob in production. Add BLOB_READ_WRITE_TOKEN in your Vercel project settings.",
      },
      { status: 503 }
    );
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const lastDot = file.name.lastIndexOf(".");
    const baseName = lastDot >= 0 ? file.name.slice(0, lastDot) : file.name;
    const ext = (lastDot >= 0 ? file.name.slice(lastDot + 1) : "mp4").toLowerCase();
    const safeName = baseName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const pathname = `video-testimonials/${Date.now()}_${safeName}.${ext}`;

    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return NextResponse.json({ success: true, url: blob.url });
  }

  // Local dev: save to public/videos/video-testimonials
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const timestamp = Date.now();
  const lastDot = file.name.lastIndexOf(".");
  const baseName = lastDot >= 0 ? file.name.slice(0, lastDot) : file.name;
  const ext = (lastDot >= 0 ? file.name.slice(lastDot + 1) : "mp4").toLowerCase();
  const safeName = baseName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fullFileName = `${timestamp}_${safeName}.${ext}`;
  const publicDir = join(process.cwd(), "public", "videos", "video-testimonials");
  await mkdir(publicDir, { recursive: true }).catch(() => {});
  const filePath = join(publicDir, fullFileName);
  await writeFile(filePath, buffer);
  const url = `/videos/video-testimonials/${fullFileName}`;
  return NextResponse.json({ success: true, url });
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    // Client upload from @vercel/blob/client sends JSON to get a token; file never hits our server.
    if (contentType.includes("application/json")) {
      return await handleTokenRequest(request);
    }
    // FormData fallback for local dev (e.g. no client upload).
    return await handleFormDataUpload(request);
  } catch (err) {
    const message = (err instanceof Error ? err.message : String(err)) || "Upload failed";
    console.error("Video testimonial upload error:", err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
