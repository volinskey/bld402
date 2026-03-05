#!/usr/bin/env node
/**
 * Deploy a showcase app to run402 and claim its subdomain.
 *
 * Usage:
 *   node showcase/deploy.mjs <app-name> [subdomain]
 *
 * Example:
 *   node showcase/deploy.mjs shared-todo todo
 *
 * Reads credentials from showcase/<app-name>/.env
 * Reads HTML from showcase/<app-name>/index.html
 * Substitutes {{API_URL}} and {{ANON_KEY}} placeholders
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { toClientEvmSigner } from "@x402/evm";

const appName = process.argv[2];
const subdomain = process.argv[3];

if (!appName) {
  console.error("Usage: node showcase/deploy.mjs <app-name> [subdomain]");
  process.exit(1);
}

// Load credentials
const envContent = readFileSync(`showcase/${appName}/.env`, "utf-8");
const env = Object.fromEntries(
  envContent.split("\n")
    .filter(l => l && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
    .filter(([k, v]) => k && v)
);

// Load wallet for x402 payment (deployments are also x402-gated)
import { fileURLToPath } from "url";
import { dirname as _dirname } from "path";
const __scriptDir = _dirname(fileURLToPath(import.meta.url));
const WALLET_FILE = join(__scriptDir, ".wallet");
const privateKey = readFileSync(WALLET_FILE, "utf-8").trim();
const account = privateKeyToAccount(privateKey);

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});
const signer = toClientEvmSigner(account, publicClient);
const client = new x402Client();
client.register("eip155:84532", new ExactEvmScheme(signer));
const fetchPaid = wrapFetchWithPayment(fetch, client);

// Build file list — substitute placeholders
const appDir = `showcase/${appName}`;
const files = [];

// PostgREST URL for this project's schema
const restUrl = `${env.API_URL}`;

function addFile(filePath, relativePath) {
  let content = readFileSync(filePath, "utf-8");
  content = content.replace(/\{\{API_URL\}\}/g, restUrl);
  content = content.replace(/\{\{ANON_KEY\}\}/g, env.ANON_KEY);
  content = content.replace(/\{\{PROJECT_ID\}\}/g, env.PROJECT_ID);
  files.push({
    file: relativePath,
    data: content,
    encoding: "utf-8",
  });
}

// Add index.html
addFile(join(appDir, "index.html"), "index.html");

// Add any other HTML/CSS/JS files in the directory (not .sql, .env, etc.)
const webExtensions = [".html", ".css", ".js", ".svg", ".png", ".jpg", ".ico"];
for (const entry of readdirSync(appDir)) {
  if (entry === "index.html") continue; // already added
  const ext = entry.substring(entry.lastIndexOf("."));
  if (webExtensions.includes(ext)) {
    addFile(join(appDir, entry), entry);
  }
}

console.log(`Deploying ${appName} (${files.length} file(s))...`);

// Deploy via x402
const deployRes = await fetchPaid(`${env.API_URL}/v1/deployments`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: `bld402-${appName}`,
    project: env.PROJECT_ID,
    files,
  }),
});

if (!deployRes.ok) {
  console.error(`Deploy failed (${deployRes.status}):`, await deployRes.text());
  process.exit(1);
}

const deployment = await deployRes.json();
console.log("\nDeployed!");
console.log("  deployment_id:", deployment.id);
console.log("  url:", deployment.url);

// Update .env with deployment info
const envUpdate = envContent + [
  `DEPLOYMENT_ID=${deployment.id}`,
  `DEPLOYMENT_URL=${deployment.url}`,
  "",
].join("\n");
writeFileSync(`showcase/${appName}/.env`, envUpdate, "utf-8");

// Claim subdomain (if specified)
if (subdomain) {
  console.log(`\nClaiming subdomain '${subdomain}'...`);
  const subRes = await fetch(`${env.API_URL}/v1/subdomains`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.SERVICE_KEY}`,
    },
    body: JSON.stringify({
      name: subdomain,
      deployment_id: deployment.id,
    }),
  });

  if (!subRes.ok) {
    console.error(`Subdomain claim failed (${subRes.status}):`, await subRes.text());
  } else {
    const sub = await subRes.json();
    console.log("  subdomain_url:", sub.url);

    // Append to .env
    const finalEnv = envUpdate + [
      `SUBDOMAIN=${subdomain}`,
      `SUBDOMAIN_URL=${sub.url}`,
      "",
    ].join("\n");
    writeFileSync(`showcase/${appName}/.env`, finalEnv, "utf-8");
  }
}

// Pin the project (requires platform admin key from AWS Secrets Manager)
console.log("\nPinning project (lease never expires)...");
let adminKey = "";
try {
  const { execSync } = await import("child_process");
  adminKey = execSync(
    'aws secretsmanager get-secret-value --secret-id "agentdb/admin-key" --query SecretString --output text --region us-east-1 --profile kychee',
    { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
  ).trim();
} catch (err) {
  console.log("  Could not fetch admin key from AWS Secrets Manager (agentdb/admin-key)");
  console.log("  Ensure 'aws sso login --profile kychee' has been run");
  console.log("  Skipping pin.");
}

if (adminKey) {
  const pinRes = await fetch(`${env.API_URL}/admin/v1/projects/${env.PROJECT_ID}/pin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.SERVICE_KEY}`,
      "X-Admin-Key": adminKey,
    },
  });

  if (!pinRes.ok) {
    console.error(`Pin failed (${pinRes.status}):`, await pinRes.text());
  } else {
    const pin = await pinRes.json();
    console.log("  pinned:", pin.pinned);
  }
}

console.log("\nDone! App should be live at:");
if (subdomain) {
  console.log(`  https://${subdomain}.run402.com`);
}
console.log(`  ${deployment.url}`);
