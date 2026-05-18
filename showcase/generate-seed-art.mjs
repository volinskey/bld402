#!/usr/bin/env node
/**
 * Generate seed art for showcase apps using run402's AI image generation,
 * then upload to each project's asset storage.
 *
 * Usage: node showcase/generate-seed-art.mjs [app-name]
 *   If app-name given, only generates for that app. Otherwise generates all.
 *
 * Cost: ~$0.90 (30 images × $0.03 each, paid via x402 from the shared wallet)
 *
 * SDK 2.0.0:
 *   - `r.ai.generateImage({ prompt })` for x402-paid generation (wallet-scoped)
 *   - `p.assets.put(key, { bytes }, ...)` for uploads (scoped to a project)
 *
 * The legacy `POST /v1/generate-image` and `POST /storage/v1/object/...`
 * endpoints are gone; `r.blobs` is renamed to `r.assets`.
 */
import { Run402Error } from "@run402/sdk";
import { getClient, loadEnv } from "./_sdk.mjs";

function assetKey(bucket, name) {
  return `${bucket}/${name}`;
}

async function assetExists(p, key) {
  try {
    await p.assets.get(key);
    return true;
  } catch (err) {
    if (err instanceof Run402Error && (err.status === 404 || err.kind === "api_error")) {
      return false;
    }
    if (err instanceof Run402Error) throw err;
    return false;
  }
}

async function generateAndUpload(r, p, prompt, bucket, storagePath) {
  const key = assetKey(bucket, storagePath);
  if (await assetExists(p, key)) {
    console.log(`  SKIP (exists): ${key}`);
    return "skipped";
  }

  console.log(`  Generating: "${prompt.substring(0, 60)}..."`);
  const result = await r.ai.generateImage({ prompt });
  const bytes = new Uint8Array(Buffer.from(result.image, "base64"));

  const ref = await p.assets.put(key, { bytes }, {
    contentType: result.content_type ?? "image/png",
    immutable: false,
  });
  console.log(`  Uploaded: ${key} → ${ref.cdnUrl ?? ref.url}`);
  return "generated";
}

const apps = {
  "ai-sticker-maker": {
    bucket: "stickers",
    images: [
      { path: "seed-01.png", prompt: "cute cartoon sticker of a rocket ship made of pizza slices, flat design, white background, die-cut sticker style" },
      { path: "seed-02.png", prompt: "cute cartoon sticker of a penguin DJ at a beach party with turntables, flat design, white background, die-cut sticker style" },
      { path: "seed-03.png", prompt: "cute cartoon sticker of a robot dog playing electric guitar, flat design, white background, die-cut sticker style" },
      { path: "seed-04.png", prompt: "cute cartoon sticker of a unicorn astronaut floating in space, flat design, white background, die-cut sticker style" },
      { path: "seed-05.png", prompt: "cute cartoon sticker of a grumpy rain cloud wearing sunglasses, flat design, white background, die-cut sticker style" },
      { path: "seed-06.png", prompt: "cute cartoon sticker of a cat wearing a top hat and monocle, flat design, white background, die-cut sticker style" },
      { path: "seed-07.png", prompt: "cute cartoon sticker of a dinosaur riding a skateboard, flat design, white background, die-cut sticker style" },
      { path: "seed-08.png", prompt: "cute cartoon sticker of a panda eating tacos, flat design, white background, die-cut sticker style" },
      { path: "seed-09.png", prompt: "cute cartoon sticker of an owl professor with round glasses and a book, flat design, white background, die-cut sticker style" },
      { path: "seed-10.png", prompt: "cute cartoon sticker of a fox in a bright orange spacesuit, flat design, white background, die-cut sticker style" },
      { path: "seed-11.png", prompt: "cute cartoon sticker of a snail driving a tiny red race car, flat design, white background, die-cut sticker style" },
      { path: "seed-12.png", prompt: "cute cartoon sticker of a hedgehog wearing big purple headphones, flat design, white background, die-cut sticker style" },
      { path: "seed-13.png", prompt: "cute cartoon sticker of a llama wearing a black tuxedo with bow tie, flat design, white background, die-cut sticker style" },
      { path: "seed-14.png", prompt: "cute cartoon sticker of an octopus juggling colorful balls, flat design, white background, die-cut sticker style" },
      { path: "seed-15.png", prompt: "cute cartoon sticker of a bear holding a paintbrush painting a rainbow, flat design, white background, die-cut sticker style" },
    ],
  },
  "photo-wall": {
    bucket: "photos",
    images: [
      { path: "seed-01.jpg", prompt: "happy developer celebrating at desk with laptop showing green checkmarks, office setting, warm lighting, candid photo style" },
      { path: "seed-02.jpg", prompt: "adorable golden retriever puppy sitting at an office desk with glasses, looking at camera, warm natural lighting" },
      { path: "seed-03.jpg", prompt: "abstract digital art with flowing neon colors, geometric shapes, futuristic robot painting on canvas" },
      { path: "seed-04.jpg", prompt: "stunning golden sunset over calm ocean with dramatic clouds, vivid colors, landscape photography" },
      { path: "seed-05.jpg", prompt: "funny cartoon of a tired programmer at desk surrounded by coffee cups, dark circles under eyes, humorous illustration" },
      { path: "seed-06.jpg", prompt: "giant server room filled with blinking lights and cables, dramatic perspective, blue-tinted lighting, tech photography" },
      { path: "seed-07.jpg", prompt: "rubber duck sitting on a computer keyboard with code on screen, macro photography, warm desk lamp lighting" },
      { path: "seed-08.jpg", prompt: "butterfly emerging from a cocoon made of code and binary numbers, digital art, vibrant colors" },
      { path: "seed-09.jpg", prompt: "cat sleeping on a laptop keyboard, cozy morning light through window, candid pet photography" },
      { path: "seed-10.jpg", prompt: "yellow rubber duck wearing tiny glasses and graduation cap, professor duck, studio photography on white background" },
      { path: "seed-11.jpg", prompt: "dramatic scene of finger hovering over deploy button on keyboard, Friday afternoon, suspenseful lighting" },
      { path: "seed-12.jpg", prompt: "stack of colorful books about programming with a coffee mug on top, cozy reading nook, warm lighting" },
    ],
  },
  "micro-blog": {
    bucket: "posts",
    images: [
      { path: "seed-dog.jpg", prompt: "adorable corgi puppy with big eyes looking at camera, sitting in a park with green grass, warm afternoon sunlight, candid photo" },
      { path: "seed-sunset.jpg", prompt: "breathtaking purple and orange sunset over a city skyline, dramatic clouds, golden hour photography" },
      { path: "seed-ramen.jpg", prompt: "steaming bowl of ramen with soft-boiled egg and green onions, overhead shot, restaurant table, warm lighting, food photography" },
    ],
  },
};

const targetApp = process.argv[2];
const appsToProcess = targetApp ? { [targetApp]: apps[targetApp] } : apps;

if (targetApp && !apps[targetApp]) {
  console.error(`Unknown app: ${targetApp}. Available: ${Object.keys(apps).join(", ")}`);
  process.exit(1);
}

const r = getClient();
let totalGenerated = 0;
let totalSkipped = 0;
let totalFailed = 0;

for (const [appName, config] of Object.entries(appsToProcess)) {
  console.log(`\n=== ${appName} (${config.images.length} images) ===`);
  const env = loadEnv(appName);
  const p = await r.project(env.PROJECT_ID);

  for (const img of config.images) {
    try {
      const result = await generateAndUpload(r, p, img.prompt, config.bucket, img.path);
      if (result === "skipped") totalSkipped++;
      else totalGenerated++;
    } catch (err) {
      if (err instanceof Run402Error) {
        console.error(`  FAILED [${err.kind}] ${img.path}: ${err.message}`);
        if (err.kind === "payment_required") {
          console.error(`  OUT OF FUNDS — stopping. Refill wallet and re-run to continue.`);
          console.log(`\n=== Done: ${totalGenerated} generated, ${totalSkipped} skipped, ${totalFailed} failed ===`);
          process.exit(1);
        }
      } else {
        console.error(`  FAILED ${img.path}: ${err.message}`);
      }
      totalFailed++;
    }
  }
}

console.log(`\n=== Done: ${totalGenerated} generated, ${totalSkipped} skipped, ${totalFailed} failed ===`);
