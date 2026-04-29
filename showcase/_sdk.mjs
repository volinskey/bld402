/**
 * Shared SDK bootstrap for showcase scripts.
 *
 * Wires `@run402/sdk/node` to the showcase-local wallet and keystore:
 *   - `showcase/.allowance.json` — wallet (auto-migrated from legacy `showcase/.wallet`)
 *   - `showcase/.keystore.json`  — per-project anon/service keys cached by the SDK
 *
 * Per-app `showcase/<app>/.env` files remain the source of truth for downstream
 * tooling (deploy-time placeholder substitution, redeploy script). The SDK
 * keystore is kept in sync as a side effect of provision.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { run402 } from "@run402/sdk/node";
import { privateKeyToAccount } from "viem/accounts";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const ALLOWANCE_PATH = join(__dirname, ".allowance.json");
export const KEYSTORE_PATH = join(__dirname, ".keystore.json");
export const LEGACY_WALLET_PATH = join(__dirname, ".wallet");
export const API_URL = "https://api.run402.com";

/**
 * Migrate `showcase/.wallet` (raw hex private key) into the SDK's
 * `.allowance.json` shape if present and the JSON file does not yet exist.
 * Returns the resolved wallet address, or `null` if neither file exists.
 */
export function ensureAllowance() {
  if (existsSync(ALLOWANCE_PATH)) {
    const data = JSON.parse(readFileSync(ALLOWANCE_PATH, "utf-8"));
    return data.address;
  }
  if (existsSync(LEGACY_WALLET_PATH)) {
    const privateKey = readFileSync(LEGACY_WALLET_PATH, "utf-8").trim();
    const account = privateKeyToAccount(privateKey);
    const data = {
      address: account.address,
      privateKey,
      created: new Date().toISOString(),
      funded: false,
    };
    writeFileSync(ALLOWANCE_PATH, JSON.stringify(data, null, 2), { mode: 0o600 });
    console.log(`Migrated showcase/.wallet → showcase/.allowance.json (${account.address})`);
    return account.address;
  }
  return null;
}

/**
 * Build a Run402 SDK client.
 *
 * Resolution order for the wallet/keystore:
 *   1. If `showcase/.allowance.json` or `showcase/.wallet` exists, use the
 *      showcase-local paths (auto-migrating `.wallet` → `.allowance.json`).
 *   2. Otherwise fall through to the SDK's default paths (`~/.config/run402/`)
 *      so a wallet created by `npx run402 init` is picked up automatically.
 */
export function getClient() {
  const haveLocalWallet = ensureAllowance() !== null;
  return run402({
    apiBase: API_URL,
    ...(haveLocalWallet ? { allowancePath: ALLOWANCE_PATH, keystorePath: KEYSTORE_PATH } : {}),
  });
}

/** Parse a `KEY=value` `.env` file, ignoring blank/comment lines. */
export function loadEnv(appName) {
  const path = join("showcase", appName, ".env");
  if (!existsSync(path)) {
    throw new Error(`No .env at ${path} — run provision.mjs first`);
  }
  const text = readFileSync(path, "utf-8");
  return Object.fromEntries(
    text
      .split("\n")
      .filter((l) => l && !l.startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      })
      .filter(([k, v]) => k && v),
  );
}

/**
 * Write a `KEY=value` `.env` file for the named app, preserving a header
 * comment with the app name and write timestamp.
 */
export function saveEnv(appName, data) {
  const path = join("showcase", appName, ".env");
  const lines = [
    `# bld402 showcase: ${appName}`,
    `# Updated: ${new Date().toISOString()}`,
    ...Object.entries(data).map(([k, v]) => `${k}=${v}`),
    "",
  ];
  writeFileSync(path, lines.join("\n"), "utf-8");
}
