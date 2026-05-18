/**
 * Download seed images from storage, compress to JPEG/PNG, re-upload.
 * Reduces ~10MB PNGs to ~100-300KB JPEGs.
 *
 * SDK 2.0.0: storage is `r.assets` (renamed from the old `r.blobs`). The
 * scoped form `p.assets.{get, put}` drops the projectId argument. The legacy
 * `POST /storage/v1/object/:bucket/*` HTTP endpoint is gone — bytes flow
 * through the 3-step direct-to-S3 CAS flow.
 */
import sharp from "sharp";
import { Run402Error } from "@run402/sdk";
import { getClient, loadEnv } from "./_sdk.mjs";

const APPS = [
  {
    name: "photo-wall",
    bucket: "photos",
    images: Array.from({ length: 12 }, (_, i) => `seed-${String(i + 1).padStart(2, "0")}.jpg`),
  },
  {
    name: "ai-sticker-maker",
    bucket: "stickers",
    images: Array.from({ length: 10 }, (_, i) => `seed-${String(i + 1).padStart(2, "0")}.png`),
  },
  {
    name: "micro-blog",
    bucket: "posts",
    images: ["seed-dog.jpg", "seed-food.jpg", "seed-sunset.jpg"],
  },
];

// Asset keys are flat per-project. We embed the legacy bucket into the key
// (e.g. "photos/seed-01.jpg") so existing references keep working.
function assetKey(bucket, name) {
  return `${bucket}/${name}`;
}

async function processApp(app) {
  const env = loadEnv(app.name);
  const r = getClient();
  const p = await r.project(env.PROJECT_ID);

  console.log(`\n=== ${app.name} (${app.images.length} images) ===`);

  for (const imageName of app.images) {
    const key = assetKey(app.bucket, imageName);
    let originalBuf;
    try {
      console.log(`  Downloading ${key}...`);
      const response = await p.assets.get(key);
      originalBuf = Buffer.from(await response.arrayBuffer());
    } catch (err) {
      if (err instanceof Run402Error) {
        console.log(`    SKIP (${err.kind}): ${err.message}`);
      } else {
        console.log(`    SKIP: ${err.message}`);
      }
      continue;
    }
    const originalKB = Math.round(originalBuf.length / 1024);

    let compressedBuf;
    let contentType;
    if (imageName.endsWith(".png")) {
      compressedBuf = await sharp(originalBuf)
        .resize(512, 512, { fit: "inside" })
        .png({ quality: 80, compressionLevel: 9 })
        .toBuffer();
      contentType = "image/png";
    } else {
      compressedBuf = await sharp(originalBuf)
        .resize(800, 800, { fit: "inside" })
        .jpeg({ quality: 80 })
        .toBuffer();
      contentType = "image/jpeg";
    }

    const compressedKB = Math.round(compressedBuf.length / 1024);
    const ratio = Math.round((1 - compressedBuf.length / originalBuf.length) * 100);
    console.log(`    ${originalKB}KB → ${compressedKB}KB (${ratio}% smaller)`);

    try {
      const ref = await p.assets.put(
        key,
        { bytes: new Uint8Array(compressedBuf) },
        { contentType, immutable: false },
      );
      console.log(`    ✓ uploaded → ${ref.cdnUrl ?? ref.url}`);
    } catch (err) {
      if (err instanceof Run402Error) {
        console.log(`    UPLOAD FAILED [${err.kind}]: ${err.message}`);
      } else {
        console.log(`    UPLOAD FAILED: ${err.message}`);
      }
    }
  }
}

for (const app of APPS) {
  await processApp(app);
}

console.log("\nDone!");
