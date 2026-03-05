#!/usr/bin/env node
/**
 * Run SQL against a showcase app's run402 project.
 *
 * Usage:
 *   node showcase/run-sql.mjs <app-name> <sql-file>
 *
 * Reads credentials from showcase/<app-name>/.env
 */

import { readFileSync } from "fs";

const appName = process.argv[2];
const sqlFile = process.argv[3];

if (!appName || !sqlFile) {
  console.error("Usage: node showcase/run-sql.mjs <app-name> <sql-file>");
  process.exit(1);
}

// Load credentials
const envContent = readFileSync(`showcase/${appName}/.env`, "utf-8");
const env = Object.fromEntries(
  envContent.split("\n")
    .filter(l => l && !l.startsWith("#"))
    .map(l => l.split("=").map(s => s.trim()))
    .filter(([k, v]) => k && v)
);

const sql = readFileSync(sqlFile, "utf-8");
console.log(`Running ${sqlFile} against project ${env.PROJECT_ID}...`);

const res = await fetch(`${env.API_URL}/admin/v1/projects/${env.PROJECT_ID}/sql`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${env.SERVICE_KEY}`,
  },
  body: JSON.stringify({ sql }),
});

if (!res.ok) {
  console.error(`SQL failed (${res.status}):`, await res.text());
  process.exit(1);
}

const result = await res.json();
console.log("SQL executed successfully");
console.log("  rows:", result.rowCount);
if (result.rows?.length > 0) {
  console.log("  result:", JSON.stringify(result.rows, null, 2));
}
