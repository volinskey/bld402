#!/usr/bin/env node
/**
 * Provision a run402 project for bld402 showcase apps.
 *
 * Usage:
 *   node showcase/provision.mjs <app-name>
 *
 * Example:
 *   node showcase/provision.mjs shared-todo
 *
 * This script:
 *   1. Loads or creates a wallet (saved to showcase/.wallet)
 *   2. Gets testnet USDC from faucet (if needed)
 *   3. Creates a prototype project via x402 payment
 *   4. Outputs credentials to showcase/<app-name>/.env
 *
 * The wallet is reused across all showcase apps.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { toClientEvmSigner } from "@x402/evm";

const API_URL = "https://api.run402.com";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const WALLET_FILE = join(__dirname, ".wallet");
const appName = process.argv[2];

if (!appName) {
  console.error("Usage: node showcase/provision.mjs <app-name>");
  process.exit(1);
}

// --- Step 1: Load or create wallet ---
let privateKey;
if (existsSync(WALLET_FILE)) {
  privateKey = readFileSync(WALLET_FILE, "utf-8").trim();
  console.log("Loaded existing wallet from showcase/.wallet");
} else {
  privateKey = generatePrivateKey();
  writeFileSync(WALLET_FILE, privateKey, "utf-8");
  console.log("Created new wallet, saved to showcase/.wallet");
}

const account = privateKeyToAccount(privateKey);
console.log("Wallet address:", account.address);

// --- Step 2: Request faucet ---
console.log("\nRequesting testnet USDC from faucet...");
try {
  const faucetRes = await fetch(`${API_URL}/v1/faucet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: account.address }),
  });
  if (faucetRes.ok) {
    const faucet = await faucetRes.json();
    console.log(`Faucet: ${faucet.amount} ${faucet.token} on ${faucet.network}`);
    console.log(`Tx: ${faucet.transactionHash}`);
    // Wait for the faucet transaction to settle
    console.log("Waiting 5s for faucet tx to settle...");
    await new Promise((r) => setTimeout(r, 5000));
  } else if (faucetRes.status === 429) {
    console.log("Faucet rate-limited (already dripped recently) — continuing with existing balance");
  } else {
    const text = await faucetRes.text();
    console.log(`Faucet returned ${faucetRes.status}: ${text}`);
    console.log("Continuing anyway — wallet may already have funds");
  }
} catch (err) {
  console.log("Faucet request failed:", err.message);
  console.log("Continuing anyway — wallet may already have funds");
}

// --- Step 3: Create project via x402 ---
console.log("\nProvisioning project via x402 payment...");

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

const signer = toClientEvmSigner(account, publicClient);
const client = new x402Client();
client.register("eip155:84532", new ExactEvmScheme(signer));
const fetchPaid = wrapFetchWithPayment(fetch, client);

const projectRes = await fetchPaid(`${API_URL}/v1/projects`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: `bld402-showcase-${appName}` }),
});

if (!projectRes.ok) {
  console.error(`Project creation failed (${projectRes.status}):`, await projectRes.text());
  process.exit(1);
}

const project = await projectRes.json();
console.log("\nProject created!");
console.log("  project_id:", project.project_id);
console.log("  tier:", project.tier);
console.log("  schema_slot:", project.schema_slot);
console.log("  lease_expires_at:", project.lease_expires_at);

// --- Step 4: Save credentials ---
const envContent = [
  `# bld402 showcase: ${appName}`,
  `# Provisioned: ${new Date().toISOString()}`,
  `PROJECT_ID=${project.project_id}`,
  `ANON_KEY=${project.anon_key}`,
  `SERVICE_KEY=${project.service_key}`,
  `SCHEMA_SLOT=${project.schema_slot}`,
  `API_URL=${API_URL}`,
  `TIER=${project.tier}`,
  `LEASE_EXPIRES_AT=${project.lease_expires_at}`,
  `WALLET_ADDRESS=${account.address}`,
  "",
].join("\n");

const envPath = `showcase/${appName}/.env`;
writeFileSync(envPath, envContent, "utf-8");
console.log(`\nCredentials saved to ${envPath}`);
console.log("\nNext steps:");
console.log(`  1. Run schema:  node showcase/run-sql.mjs ${appName} showcase/${appName}/schema.sql`);
console.log(`  2. Run seed:    node showcase/run-sql.mjs ${appName} showcase/${appName}/seed.sql`);
console.log(`  3. Deploy:      node showcase/deploy.mjs ${appName}`);
