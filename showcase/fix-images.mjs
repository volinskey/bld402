/**
 * Generate placeholder seed images using sharp and upload directly to S3.
 * Bypasses the run402 gateway storage bug (express.text corrupts binary).
 *
 * Usage: node showcase/fix-images.mjs
 */
import sharp from 'sharp';
import { execSync } from 'child_process';

const S3_BUCKET = 'agentdb-storage-472210437512';
const PROFILE = 'kychee';
const REGION = 'us-east-1';

// Color palettes for variety
const COLORS = [
  { r: 255, g: 107, b: 107 }, // coral
  { r: 78, g: 205, b: 196 },  // teal
  { r: 255, g: 230, b: 109 }, // yellow
  { r: 106, g: 76, b: 147 },  // purple
  { r: 85, g: 239, b: 196 },  // mint
  { r: 253, g: 150, b: 68 },  // orange
  { r: 129, g: 236, b: 236 }, // cyan
  { r: 162, g: 155, b: 254 }, // lavender
  { r: 0, g: 184, b: 148 },   // green
  { r: 255, g: 118, b: 117 }, // pink
  { r: 116, g: 185, b: 255 }, // blue
  { r: 253, g: 203, b: 110 }, // peach
];

const APPS = [
  {
    projectId: 'prj_1772821540820_0021',
    bucket: 'photos',
    images: Array.from({ length: 12 }, (_, i) => ({
      path: `seed-${String(i + 1).padStart(2, '0')}.jpg`,
      color: COLORS[i % COLORS.length],
      format: 'jpeg',
      size: 800,
    })),
  },
  {
    projectId: 'prj_1772821561151_0023',
    bucket: 'stickers',
    images: Array.from({ length: 10 }, (_, i) => ({
      path: `seed-${String(i + 1).padStart(2, '0')}.png`,
      color: COLORS[i % COLORS.length],
      format: 'png',
      size: 512,
    })),
  },
  {
    projectId: 'prj_1772821520504_0020',
    bucket: 'posts',
    images: [
      { path: 'seed-dog.jpg', color: { r: 255, g: 200, b: 150 }, format: 'jpeg', size: 800 },
      { path: 'seed-sunset.jpg', color: { r: 255, g: 150, b: 100 }, format: 'jpeg', size: 800 },
      { path: 'seed-ramen.jpg', color: { r: 200, g: 150, b: 100 }, format: 'jpeg', size: 800 },
    ],
  },
];

async function generateAndUpload(projectId, bucket, image) {
  const { path, color, format, size } = image;

  // Create a gradient-like image with text overlay
  const buf = format === 'jpeg'
    ? await sharp({ create: { width: size, height: size, channels: 3, background: color } })
        .jpeg({ quality: 80 })
        .toBuffer()
    : await sharp({ create: { width: size, height: size, channels: 4, background: { ...color, alpha: 255 } } })
        .png({ compressionLevel: 9 })
        .toBuffer();

  const s3Key = `${projectId}/${bucket}/${path}`;
  const contentType = format === 'jpeg' ? 'image/jpeg' : 'image/png';

  // Write to temp file and upload via AWS CLI
  const tmpFile = `/tmp/seed-img-${Date.now()}.${format}`;
  const { writeFileSync, unlinkSync } = await import('fs');
  writeFileSync(tmpFile, buf);

  try {
    execSync(
      `aws s3 cp "${tmpFile}" "s3://${S3_BUCKET}/${s3Key}" --profile ${PROFILE} --region ${REGION} --content-type "${contentType}"`,
      { stdio: 'pipe' }
    );
    console.log(`  ✓ ${bucket}/${path} (${Math.round(buf.length / 1024)}KB)`);
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}

for (const app of APPS) {
  console.log(`\n=== ${app.bucket} (${app.images.length} images) ===`);
  for (const img of app.images) {
    await generateAndUpload(app.projectId, app.bucket, img);
  }
}

console.log('\nDone! All images uploaded directly to S3 (bypassing gateway).');
