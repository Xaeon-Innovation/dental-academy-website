/* eslint-disable no-console */
import { getAdminDb } from "../src/lib/firebase/admin";
import { addLogoWatermark } from "../src/lib/imageWatermark";
import { put } from "@vercel/blob";

async function main() {
  const db = getAdminDb();
  if (!db) {
    console.error("Admin Firestore is not configured. Configure FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 before running this script.");
    process.exit(1);
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN is required to upload watermarked images to Vercel Blob.");
    process.exit(1);
  }

  const snapshot = await db.collection("cases").get();
  console.log(`Found ${snapshot.size} cases`);

  for (const doc of snapshot.docs) {
    const data = doc.data() as any;
    const images: string[] = data.images || [];

    if (!Array.isArray(images) || images.length === 0) continue;

    const updatedUrls: string[] = [];

    for (const url of images) {
      try {
        if (typeof url !== "string" || !url) {
          updatedUrls.push(url);
          continue;
        }

        if (url.includes("-wm.")) {
          updatedUrls.push(url);
          continue;
        }

        console.log(`Watermarking image for case ${doc.id}: ${url}`);

        const res = await fetch(url);
        if (!res.ok) {
          console.warn(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
          updatedUrls.push(url);
          continue;
        }

        const arrayBuffer = await res.arrayBuffer();
        const originalBuffer = Buffer.from(arrayBuffer);
        const watermarkedBuffer = await addLogoWatermark(originalBuffer);

        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split("/").filter(Boolean);
        const fileName = pathParts[pathParts.length - 1] ?? `case_${Date.now()}.jpg`;

        const wmName = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, "-wm.jpg");
        const pathname = `cases/${wmName}`;

        const blob = await put(pathname, watermarkedBuffer, {
          access: "public",
          addRandomSuffix: true,
        });

        updatedUrls.push(blob.url);
      } catch (err) {
        console.error(`Error processing image ${url} for case ${doc.id}:`, err);
        updatedUrls.push(url);
      }
    }

    await doc.ref.update({ images: updatedUrls });
  }

  console.log("Watermark migration completed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

