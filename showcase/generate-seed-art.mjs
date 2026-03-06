#!/usr/bin/env node
/**
 * Generate seed art for showcase apps using run402 generate-image API.
 * Uploads generated images to each project's storage bucket.
 *
 * Usage: node showcase/generate-seed-art.mjs [app-name]
 *   If app-name given, only generates for that app. Otherwise generates all.
 *
 * Cost: ~$0.90 (30 images × $0.03 each)
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { toClientEvmSigner } from "@x402/evm";

const __scriptDir = dirname(fileURLToPath(import.meta.url));
const WALLET_FILE = join(__scriptDir, ".wallet");
const privateKey = readFileSync(WALLET_FILE, "utf-8").trim();
const account = privateKeyToAccount(privateKey);

const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });
const signer = toClientEvmSigner(account, publicClient);
const client = new x402Client();
client.register("eip155:84532", new ExactEvmScheme(signer));
const fetchPaid = wrapFetchWithPayment(fetch, client);

function loadEnv(appName) {
  const content = readFileSync(`showcase/${appName}/.env`, "utf-8");
  return Object.fromEntries(
    content.split("\n")
      .filter(l => l && !l.startsWith("#"))
      .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
      .filter(([k, v]) => k && v)
  );
}

const API_URL = "https://api.run402.com";

// Generate image via x402 — returns base64 buffer
async function generateImage(prompt) {
  console.log(`  Generating: "${prompt.substring(0, 60)}..."...`);
  const res = await fetchPaid(`${API_URL}/v1/generate-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Generate failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  // API returns { image: "<base64>", content_type: "image/png", size: "..." }
  if (!data.image) {
    throw new Error(`No image data in response: ${JSON.stringify(data).substring(0, 200)}`);
  }
  return Buffer.from(data.image, "base64");
}

// Upload to storage bucket (no bucket creation needed — auto-created on first upload)
async function uploadToStorage(env, bucket, path, buffer, contentType) {
  const url = `${env.API_URL}/storage/v1/object/${bucket}/${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "apikey": env.SERVICE_KEY,
      "Authorization": `Bearer ${env.SERVICE_KEY}`,
      "Content-Type": contentType,
    },
    body: buffer,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed (${res.status}): ${text}`);
  }
  const result = await res.json();
  console.log(`  Uploaded: ${bucket}/${path} (${result.size}B)`);
}

// Check if image already exists in storage
async function imageExists(env, bucket, path) {
  const url = `${env.API_URL}/storage/v1/object/${bucket}/${path}`;
  const res = await fetch(url, {
    method: "HEAD",
    headers: { "apikey": env.SERVICE_KEY },
  });
  return res.ok;
}

// Generate + upload one image (skips if already uploaded)
async function generateAndUpload(env, prompt, bucket, storagePath) {
  if (await imageExists(env, bucket, storagePath)) {
    console.log(`  SKIP (exists): ${bucket}/${storagePath}`);
    return "skipped";
  }
  const buffer = await generateImage(prompt);
  // All generated images are PNG regardless of seed filename extension
  await uploadToStorage(env, bucket, storagePath, buffer, "image/png");
  return "generated";
}

// ============== APP DEFINITIONS ==============

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

// ============== MAIN ==============

const targetApp = process.argv[2];
const appsToProcess = targetApp ? { [targetApp]: apps[targetApp] } : apps;

if (targetApp && !apps[targetApp]) {
  console.error(`Unknown app: ${targetApp}. Available: ${Object.keys(apps).join(", ")}`);
  process.exit(1);
}

let totalGenerated = 0;
let totalSkipped = 0;
let totalFailed = 0;

for (const [appName, config] of Object.entries(appsToProcess)) {
  console.log(`\n=== ${appName} (${config.images.length} images) ===`);
  const env = loadEnv(appName);

  for (const img of config.images) {
    try {
      const result = await generateAndUpload(env, img.prompt, config.bucket, img.path);
      if (result === "skipped") totalSkipped++;
      else totalGenerated++;
    } catch (err) {
      console.error(`  FAILED ${img.path}: ${err.message}`);
      totalFailed++;
      // Stop on 402 (out of funds) to avoid wasting attempts
      if (err.message.includes("402")) {
        console.error(`  OUT OF FUNDS — stopping. Refill wallet and re-run to continue.`);
        console.log(`\n=== Done: ${totalGenerated} generated, ${totalSkipped} skipped, ${totalFailed} failed ===`);
        process.exit(1);
      }
    }
  }
}

console.log(`\n=== Done: ${totalGenerated} generated, ${totalSkipped} skipped, ${totalFailed} failed ===`);
