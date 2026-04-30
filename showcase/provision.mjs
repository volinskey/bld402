#!/usr/bin/env node
/**
 * Provision a run402 project for a bld402 showcase app, via @run402/sdk.
 *
 * Usage:
 *   node showcase/provision.mjs <app-name>
 *
 * Steps:
 *   1. Ensure showcase/.allowance.json exists (migrating from .wallet, or
 *      generating a fresh wallet via the SDK).
 *   2. Request testnet USDC from the faucet (rate-limit tolerated).
 *   3. Provision a prototype-tier project. The SDK runs the x402 payment
 *      flow against the configured allowance and persists the returned keys
 *      into showcase/.keystore.json.
 *   4. Mirror the credentials to showcase/<app-name>/.env for downstream
 *      scripts that read placeholders from there.
 */
import { PaymentRequired } from "@run402/sdk";
import { ALLOWANCE_PATH, API_URL, ensureAllowance, getClient, saveEnv } from "./_sdk.mjs";

const appName = process.argv[2];
if (!appName) {
  console.error("Usage: node showcase/provision.mjs <app-name>");
  process.exit(1);
}

const r = getClient();

// --- Step 1: Allowance ---
let address = ensureAllowance();
if (!address) {
  // No showcase-local wallet — check whether the SDK has one at its default
  // path (e.g., set up via `npx run402 init`). Only create a fresh wallet
  // when the SDK reports nothing configured anywhere.
  const status = await r.allowance.status();
  if (status.configured && status.address) {
    address = status.address;
    console.log(`Using SDK-configured wallet at ${status.path ?? "default path"}`);
  } else {
    console.log("No allowance found anywhere — creating one...");
    const created = await r.allowance.create();
    address = created.address;
    console.log(`Created wallet ${address} at ${created.path ?? ALLOWANCE_PATH}`);
  }
}
console.log("Wallet address:", address);

// --- Step 2: Faucet ---
console.log("\nRequesting testnet USDC from faucet...");
try {
  const result = await r.allowance.faucet();
  // The runtime gateway response sometimes uses `amount_usd_micros` rather
  // than the `amount`/`token` fields the SDK type promises — log whichever
  // are present so we don't print "undefined USDC".
  const amount =
    result.amount ??
    (typeof result.amount_usd_micros === "number"
      ? `$${(result.amount_usd_micros / 1_000_000).toFixed(2)}`
      : null);
  const token = result.token ?? "USDC";
  const network = result.network ?? "base-sepolia";
  if (amount) console.log(`Faucet: ${amount} ${token} on ${network}`);
  else console.log(`Faucet: requested on ${network}`);
  if (result.transactionHash) console.log(`Tx: ${result.transactionHash}`);
  console.log("Waiting 5s for faucet tx to settle...");
  await new Promise((r) => setTimeout(r, 5000));
} catch (err) {
  // Rate-limit (429) and other faucet errors are non-fatal — the wallet
  // may already have funds from a prior run.
  console.log(`Faucet skipped: ${err.message}`);
}

// --- Step 3: Provision ---
console.log("\nProvisioning prototype project via x402 payment...");
let project;
try {
  project = await r.projects.provision({ tier: "prototype", name: `bld402-showcase-${appName}` });
} catch (err) {
  if (err instanceof PaymentRequired) {
    console.error("PaymentRequired — wallet has insufficient balance:");
    console.error(JSON.stringify(err.body, null, 2));
  } else {
    console.error(`Provision failed: ${err.message}`);
  }
  process.exit(1);
}

console.log("\nProject created!");
console.log("  project_id:  ", project.project_id);
console.log("  schema_slot: ", project.schema_slot);

// Tier metadata for the .env (the SDK persisted keys to keystore; the
// .env mirror is for the deploy/redeploy/run-sql/apply-rls scripts).
// `getUsage` returns tier reliably; `lease_expires_at` is documented on
// UsageReport but the runtime body sometimes omits it — try `tier.status`
// as a fallback when getUsage doesn't include it.
let tierName = "prototype";
let leaseExpiresAt = "";
try {
  const usage = await r.projects.getUsage(project.project_id);
  tierName = usage.tier ?? tierName;
  if (usage.lease_expires_at) leaseExpiresAt = usage.lease_expires_at;
} catch (err) {
  console.log(`  (couldn't read project usage: ${err.message})`);
}
if (!leaseExpiresAt) {
  try {
    const status = await r.tier.status();
    if (status.lease_expires_at) leaseExpiresAt = status.lease_expires_at;
  } catch {
    // Both sources unavailable — leave empty in .env.
  }
}
console.log("  tier:        ", tierName);
if (leaseExpiresAt) console.log("  lease_expires_at:", leaseExpiresAt);

// --- Step 4: Save .env ---
const envData = {
  PROJECT_ID: project.project_id,
  ANON_KEY: project.anon_key,
  SERVICE_KEY: project.service_key,
  SCHEMA_SLOT: project.schema_slot,
  API_URL,
  TIER: tierName,
  WALLET_ADDRESS: address,
};
if (leaseExpiresAt) envData.LEASE_EXPIRES_AT = leaseExpiresAt;
saveEnv(appName, envData);

console.log(`\nCredentials saved to showcase/${appName}/.env`);
console.log("\nNext steps:");
console.log(`  1. Run schema:  node showcase/run-sql.mjs ${appName} showcase/${appName}/schema.sql`);
console.log(`  2. Run seed:    node showcase/run-sql.mjs ${appName} showcase/${appName}/seed.sql`);
console.log(`  3. Deploy:      node showcase/deploy.mjs ${appName}`);
