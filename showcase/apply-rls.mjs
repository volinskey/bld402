#!/usr/bin/env node
/**
 * Apply RLS policies for a showcase app using its template's rls.json.
 * Usage: node showcase/apply-rls.mjs <app-name>
 */
import { readFileSync } from "fs";

const appName = process.argv[2];
if (!appName) {
  console.error("Usage: node showcase/apply-rls.mjs <app-name>");
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

// Determine template directory
const utilityApps = ["micro-blog", "photo-wall", "secret-santa", "flash-cards"];
const templateDir = utilityApps.includes(appName)
  ? `templates/utility/${appName}`
  : `templates/games/${appName}`;

const rls = JSON.parse(readFileSync(`${templateDir}/rls.json`, "utf-8"));

if (!rls.policies || rls.policies.length === 0) {
  console.log("No RLS policies to apply");
  process.exit(0);
}

for (const policy of rls.policies) {
  const tables = policy.tables.map(t => t.table).join(", ");
  console.log(`Applying '${policy.template}' to ${tables}...`);

  const res = await fetch(`${env.API_URL}/admin/v1/projects/${env.PROJECT_ID}/rls`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.SERVICE_KEY}`,
    },
    body: JSON.stringify({
      template: policy.template,
      tables: policy.tables,
    }),
  });

  if (!res.ok) {
    console.error(`FAILED (${res.status}):`, await res.text());
  } else {
    const result = await res.json();
    console.log(`OK: ${result.template}`);
  }
}
