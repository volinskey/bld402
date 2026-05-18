#!/usr/bin/env node
/**
 * Deploy a showcase app to run402, via @run402/sdk's unified deploy.
 *
 * Usage:
 *   node showcase/deploy.mjs <app-name> [subdomain]
 *
 * Reads showcase/<app-name>/.env for credentials and showcase/<app-name>/*
 * for files. Substitutes `{{API_URL}}`, `{{ANON_KEY}}`, `{{PROJECT_ID}}`
 * placeholders in text files, then calls `(await r.project(id)).apply`
 * (SDK 2.0+) with the site + subdomain in one shot. The state machine
 * claims/reassigns the subdomain atomically with the site activation.
 *
 * Pin uses a direct admin call (the SDK's `projects.pin` returns 403 for
 * non-platform-admin callers; the showcase needs the platform admin key
 * out-of-band via AWS Secrets Manager).
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Run402DeployError } from "@run402/sdk";
import { API_URL, getClient, loadEnv, saveEnv } from "./_sdk.mjs";

const appName = process.argv[2];
const subdomain = process.argv[3];

if (!appName) {
  console.error("Usage: node showcase/deploy.mjs <app-name> [subdomain]");
  process.exit(1);
}

const env = loadEnv(appName);
const r = getClient();

// --- Build the FileSet with placeholder substitution ---
const appDir = `showcase/${appName}`;
const TEXT_EXT = new Set([".html", ".css", ".js", ".svg", ".json", ".txt"]);
const BINARY_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico"]);

function substitute(content) {
  return content
    .replace(/\{\{API_URL\}\}/g, API_URL)
    .replace(/\{\{ANON_KEY\}\}/g, env.ANON_KEY)
    .replace(/\{\{PROJECT_ID\}\}/g, env.PROJECT_ID);
}

const fileSet = {};
for (const entry of readdirSync(appDir)) {
  const ext = entry.slice(entry.lastIndexOf(".")).toLowerCase();
  const path = join(appDir, entry);
  if (TEXT_EXT.has(ext)) {
    fileSet[entry] = substitute(readFileSync(path, "utf-8"));
  } else if (BINARY_EXT.has(ext)) {
    fileSet[entry] = new Uint8Array(readFileSync(path));
  }
  // .sql, .env, etc. are skipped.
}

const fileCount = Object.keys(fileSet).length;
if (fileCount === 0) {
  console.error(`No deployable files found in ${appDir}`);
  process.exit(1);
}
console.log(`Deploying ${appName} (${fileCount} file${fileCount === 1 ? "" : "s"})...`);
if (subdomain) console.log(`  with subdomain: ${subdomain}`);

// --- Deploy via SDK (unified state machine) ---
// SDK 2.0.0: the public hero is `(await r.project(id)).apply(spec)`. The old
// `r.deploy.apply(...)` was removed in v1.48 — `Deploy` is internal now.
const p = await r.project(env.PROJECT_ID);
let result;
try {
  result = await p.apply(
    {
      site: { replace: fileSet },
      ...(subdomain ? { subdomains: { set: [subdomain] } } : {}),
    },
    {
      onEvent: (event) => {
        if (event.type === "commit.phase" && event.status !== "started") {
          console.log(`  ${event.phase}: ${event.status}`);
        }
        if (event.type === "content.upload.progress" && event.done === event.total) {
          console.log(`  uploaded: ${event.label}`);
        }
        if (event.type === "ready") {
          for (const [k, v] of Object.entries(event.urls)) {
            console.log(`  ${k}: ${v}`);
          }
        }
      },
    },
  );
} catch (err) {
  if (err instanceof Run402DeployError) {
    console.error(`\nDeploy failed [${err.code}]: ${err.message}`);
    if (err.fix) console.error("Fix:", JSON.stringify(err.fix, null, 2));
  } else {
    console.error(`\nDeploy failed: ${err.message}`);
  }
  process.exit(1);
}

console.log(`\nDeployed! release_id=${result.release_id}`);
const deploymentUrl = result.urls?.site ?? result.urls?.deployment ?? "";
const subdomainUrl = subdomain ? `https://${subdomain}.run402.com` : "";

// --- Save .env ---
const updated = {
  ...env,
  RELEASE_ID: result.release_id,
  ...(deploymentUrl ? { DEPLOYMENT_URL: deploymentUrl } : {}),
  ...(subdomain ? { SUBDOMAIN: subdomain, SUBDOMAIN_URL: subdomainUrl } : {}),
};
saveEnv(appName, updated);

// --- Pin (platform admin only) ---
console.log("\nPinning project (lease never expires)...");
let adminKey = "";
try {
  const { execSync } = await import("node:child_process");
  adminKey = execSync(
    'aws secretsmanager get-secret-value --secret-id "agentdb/admin-key" --query SecretString --output text --region us-east-1 --profile kychee',
    { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
  ).trim();
} catch {
  console.log("  Could not fetch admin key (run 'aws sso login --profile kychee' first). Skipping pin.");
}

if (adminKey) {
  const pinRes = await fetch(`${API_URL}/projects/v1/admin/${env.PROJECT_ID}/pin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.SERVICE_KEY}`,
      "X-Admin-Key": adminKey,
    },
  });
  if (!pinRes.ok) {
    console.log(`  Pin failed (${pinRes.status}): ${await pinRes.text()}`);
  } else {
    console.log("  Pinned");
  }
}

console.log("\nDone! App should be live at:");
if (subdomainUrl) console.log(`  ${subdomainUrl}`);
if (deploymentUrl) console.log(`  ${deploymentUrl}`);
