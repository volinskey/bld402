#!/usr/bin/env node
/**
 * Deploy server-side functions for the Paste Locker showcase app.
 *
 * Usage:
 *   node showcase/paste-locker/deploy-functions.mjs
 *
 * Reads credentials from showcase/paste-locker/.env
 * Deploys create-note and read-note functions from templates/utility/paste-locker/
 */

import { readFileSync } from "fs";

// Load credentials
const envContent = readFileSync("showcase/paste-locker/.env", "utf-8");
const env = Object.fromEntries(
  envContent.split("\n")
    .filter(l => l && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
    .filter(([k, v]) => k && v)
);

const functions = [
  { name: "create-note", file: "templates/utility/paste-locker/create-note.js" },
  { name: "read-note", file: "templates/utility/paste-locker/read-note.js" },
];

for (const fn of functions) {
  console.log(`Deploying function: ${fn.name}...`);
  const code = readFileSync(fn.file, "utf-8");

  const res = await fetch(`${env.API_URL}/admin/v1/projects/${env.PROJECT_ID}/functions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.SERVICE_KEY}`,
    },
    body: JSON.stringify({
      name: fn.name,
      code,
      deps: ["bcryptjs", "zod"],
    }),
  });

  if (!res.ok) {
    console.error(`  Failed (${res.status}):`, await res.text());
    process.exit(1);
  }

  const result = await res.json();
  console.log(`  Deployed: ${result.url}`);
  console.log(`  Status: ${result.status}`);
}

console.log("\nAll functions deployed!");
