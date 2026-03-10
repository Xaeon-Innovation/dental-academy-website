import imageCompression, { type Options as ImageCompressionOptions } from "browser-image-compression";

export type CompressionPreset = "case" | "instructor" | "homeHero" | "homeCta";

type CompressImageOptions = {
  preset?: CompressionPreset;
} & Partial<ImageCompressionOptions>;

const PRESETS: Record<CompressionPreset, ImageCompressionOptions> = {
  case: {
    maxWidthOrHeight: 1600,
    maxSizeMB: 1,
    fileType: "image/webp",
    useWebWorker: true,
  },
  instructor: {
    maxWidthOrHeight: 800,
    maxSizeMB: 0.5,
    fileType: "image/webp",
    useWebWorker: true,
  },
  homeHero: {
    maxWidthOrHeight: 2000,
    maxSizeMB: 1.5,
    fileType: "image/webp",
    useWebWorker: true,
  },
  homeCta: {
    maxWidthOrHeight: 1600,
    maxSizeMB: 1,
    fileType: "image/webp",
    useWebWorker: true,
  },
};

export async function compressImageFile(file: File, options: CompressImageOptions = {}): Promise<File> {
  const { preset = "case", ...overrides } = options;
  const base = PRESETS[preset];
  const merged: ImageCompressionOptions = {
    ...base,
    ...overrides,
  };

  const compressed = await imageCompression(file, merged);

  // Ensure we always return a File (library can return Blob)
  if (compressed instanceof File) {
    return compressed;
  }

  const ext = (merged.fileType || file.type || "image/webp").split("/")[1] || "webp";
  const nameWithoutExt = file.name.replace(/\.[^.]+$/, "");
  return new File([compressed], `${nameWithoutExt}.${ext}`, {
    type: merged.fileType || file.type || "image/webp",
    lastModified: Date.now(),
  });
}

