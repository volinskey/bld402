/**
 * Download seed images from storage, compress to JPEG, re-upload.
 * Reduces ~10MB PNGs to ~100-300KB JPEGs.
 */
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const APPS = [
  {
    name: 'photo-wall',
    bucket: 'photos',
    images: Array.from({ length: 12 }, (_, i) => `seed-${String(i + 1).padStart(2, '0')}.jpg`),
  },
  {
    name: 'ai-sticker-maker',
    bucket: 'stickers',
    images: Array.from({ length: 10 }, (_, i) => `seed-${String(i + 1).padStart(2, '0')}.png`),
  },
  {
    name: 'micro-blog',
    bucket: 'posts',
    images: ['seed-dog.jpg', 'seed-food.jpg', 'seed-sunset.jpg'],
  },
];

async function processApp(app) {
  const envPath = resolve(__dirname, app.name, '.env');
  const envText = readFileSync(envPath, 'utf8');
  const env = Object.fromEntries(
    envText.split('\n')
      .filter(l => l && !l.startsWith('#'))
      .map(l => l.split('='))
      .map(([k, ...v]) => [k, v.join('=')])
  );

  const apiUrl = env.API_URL;
  const serviceKey = env.SERVICE_KEY;

  console.log(`\n=== ${app.name} (${app.images.length} images) ===`);

  for (const imageName of app.images) {
    const storageUrl = `${apiUrl}/storage/v1/object/${app.bucket}/${imageName}`;

    // Download
    console.log(`  Downloading ${imageName}...`);
    const dlRes = await fetch(storageUrl, {
      headers: { apikey: serviceKey },
    });
    if (!dlRes.ok) {
      console.log(`    SKIP (${dlRes.status})`);
      continue;
    }

    const originalBuf = Buffer.from(await dlRes.arrayBuffer());
    const originalKB = Math.round(originalBuf.length / 1024);

    // Compress to JPEG (or keep PNG for stickers but resize)
    let compressedBuf;
    let contentType;
    if (imageName.endsWith('.png')) {
      // Stickers: keep PNG but resize to 512x512
      compressedBuf = await sharp(originalBuf)
        .resize(512, 512, { fit: 'inside' })
        .png({ quality: 80, compressionLevel: 9 })
        .toBuffer();
      contentType = 'image/png';
    } else {
      // Photos/blog: convert to JPEG, resize to 800px max
      compressedBuf = await sharp(originalBuf)
        .resize(800, 800, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toBuffer();
      contentType = 'image/jpeg';
    }

    const compressedKB = Math.round(compressedBuf.length / 1024);
    const ratio = Math.round((1 - compressedBuf.length / originalBuf.length) * 100);
    console.log(`    ${originalKB}KB → ${compressedKB}KB (${ratio}% smaller)`);

    // Re-upload (overwrite)
    const upRes = await fetch(storageUrl, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        'Content-Type': contentType,
      },
      body: compressedBuf,
    });
    if (!upRes.ok) {
      const err = await upRes.text();
      console.log(`    UPLOAD FAILED (${upRes.status}): ${err}`);
    } else {
      console.log(`    ✓ uploaded`);
    }
  }
}

for (const app of APPS) {
  await processApp(app);
}

console.log('\nDone!');
