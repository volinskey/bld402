#!/usr/bin/env node
/**
 * Fund the test wallet via the admin faucet (no rate limit).
 *
 * Usage:
 *   node scripts/fund-wallet.mjs                  # Fund with default amount (0.25 USDC)
 *   node scripts/fund-wallet.mjs 1.00             # Fund with custom amount
 *   ADMIN_KEY=xxx node scripts/fund-wallet.mjs    # Pass admin key via env
 *
 * If ADMIN_KEY is not set, fetches from AWS Secrets Manager (agentdb/admin-key).
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { privateKeyToAccount } from "viem/accounts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WALLET_FILE = join(__dirname, "../showcase/.wallet");
const API_URL = "https://api.run402.com";

// ── Load wallet ──────────────────────────────────────────────────
if (!existsSync(WALLET_FILE)) {
  console.error("ERROR: No wallet file at showcase/.wallet");
  console.error("  Run gate2-test first to create one, or create manually.");
  process.exit(1);
}

const privateKey = readFileSync(WALLET_FILE, "utf-8").trim();
const account = privateKeyToAccount(privateKey);
console.log("Wallet address:", account.address);

// ── Get admin key ────────────────────────────────────────────────
let adminKey = process.env.ADMIN_KEY || "";

if (!adminKey) {
  console.log("No ADMIN_KEY env var — fetching from AWS Secrets Manager...");
  try {
    const { execSync } = await import("child_process");
    adminKey = execSync(
      'aws secretsmanager get-secret-value --secret-id "agentdb/admin-key" --query SecretString --output text --region us-east-1 --profile kychee',
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    ).trim();
    console.log("  Admin key loaded from AWS Secrets Manager");
  } catch (err) {
    console.error("  Could not fetch admin key from AWS Secrets Manager (agentdb/admin-key)");
    console.error("  Ensure 'aws sso login --profile kychee' has been run");
    console.error("  Or set ADMIN_KEY env var directly.");
    process.exit(1);
  }
}

// ── Fund via admin faucet ────────────────────────────────────────
const amount = process.argv[2] || "0.25";
console.log(`\nFunding ${amount} USDC to ${account.address} via admin faucet...`);

const res = await fetch(`${API_URL}/faucet/v1/admin`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Admin-Key": adminKey,
  },
  body: JSON.stringify({ address: account.address, amount }),
});

if (res.ok) {
  const data = await res.json();
  console.log(`  Transaction: ${data.transaction_hash}`);
  console.log(`  Amount: ${data.amount_usd_micros / 1_000_000} ${data.token} on ${data.network}`);
  console.log("\nWallet funded successfully.");
} else {
  const text = await res.text();
  console.error(`  Admin faucet failed (${res.status}): ${text}`);
  process.exit(1);
}
