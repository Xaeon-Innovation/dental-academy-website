import sharp from "sharp";
import { join } from "path";
import { readFile } from "fs/promises";

type WatermarkOptions = {
  padding?: number;
  maxLogoWidthRatio?: number;
  maxLogoHeightRatio?: number;
};

const logoPath = join(process.cwd(), "public", "images", "logo", "logoTransparent.png");

let cachedLogo: Buffer | null = null;

async function getLogoBuffer(): Promise<Buffer> {
  if (cachedLogo) return cachedLogo;
  const data = await readFile(logoPath);
  cachedLogo = data;
  return data;
}

export async function addLogoWatermark(
  imageBuffer: Buffer,
  options: WatermarkOptions = {}
): Promise<Buffer> {
  const padding = options.padding ?? 32;
  const maxLogoWidthRatio = options.maxLogoWidthRatio ?? 0.25;
  const maxLogoHeightRatio = options.maxLogoHeightRatio ?? 0.18;

  const base = sharp(imageBuffer);
  const metadata = await base.metadata();

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (!width || !height) {
    return imageBuffer;
  }

  const logoBuffer = await getLogoBuffer();
  let logo = sharp(logoBuffer);
  const logoMeta = await logo.metadata();

  const logoWidth = logoMeta.width ?? 0;
  const logoHeight = logoMeta.height ?? 0;

  if (!logoWidth || !logoHeight) {
    return imageBuffer;
  }

  const widthLimited = width * maxLogoWidthRatio;
  const heightLimited = height * maxLogoHeightRatio;
  const scale = Math.min(widthLimited / logoWidth, heightLimited / logoHeight, 1);

  const finalLogoWidth = Math.round(logoWidth * scale);
  const finalLogoHeight = Math.round(logoHeight * scale);

  logo = logo.resize(finalLogoWidth, finalLogoHeight, { fit: "inside" });

  const compositeBuffer = await logo.toBuffer();

  const result = await base
    .composite([
      {
        input: compositeBuffer,
        gravity: "southeast",
        top: height - finalLogoHeight - padding,
        left: width - finalLogoWidth - padding,
      },
    ])
    .jpeg({ quality: 80 })
    .toBuffer();

  return result;
}

