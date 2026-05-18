#!/usr/bin/env node
/**
 * Apply a showcase app's RLS policies as a manifest, via @run402/sdk.
 *
 * Usage:
 *   node showcase/apply-rls.mjs <app-name>
 *
 * Reads templates/<utility|games>/<app>/rls.json and applies it via
 * `(await r.project(id)).apply({ database: { expose: ... } })`. Two formats supported:
 *
 *   - **Manifest v1** (preferred, has `version: "1"` and `tables`): passed
 *     through verbatim. Use `policy: "custom"` with `custom_sql` for cases
 *     the built-in templates can't express (e.g. anon read + owner writes).
 *
 *   - **Legacy** (has `policies` array): translated table-by-table:
 *       `user_owns_rows`     → `user_owns_rows`
 *       `public_read`        → `public_read_authenticated_write`
 *       `public_read_write`  → `public_read_write_UNRESTRICTED`
 *     Stacking the same table in multiple legacy policy blocks errors —
 *     the new manifest forbids it. Migrate the file to v1 with `custom`.
 */
import { readFileSync } from "node:fs";
import { Run402DeployError } from "@run402/sdk";
import { getClient, loadEnv } from "./_sdk.mjs";

const appName = process.argv[2];
if (!appName) {
  console.error("Usage: node showcase/apply-rls.mjs <app-name>");
  process.exit(1);
}

const env = loadEnv(appName);

const utilityApps = ["micro-blog", "photo-wall", "secret-santa", "flash-cards", "shared-todo", "voting-booth", "landing-waitlist", "paste-locker"];
const templateDir = utilityApps.includes(appName)
  ? `templates/utility/${appName}`
  : `templates/games/${appName}`;

const raw = JSON.parse(readFileSync(`${templateDir}/rls.json`, "utf-8"));

function legacyToManifest(legacy) {
  const TEMPLATE_MAP = {
    user_owns_rows: "user_owns_rows",
    public_read: "public_read_authenticated_write",
    public_read_write: "public_read_write_UNRESTRICTED",
  };
  const tablesByName = new Map();
  for (const policy of legacy.policies) {
    const newTemplate = TEMPLATE_MAP[policy.template];
    if (!newTemplate) {
      throw new Error(
        `Unknown legacy template '${policy.template}'. Migrate this rls.json to manifest v1 — see https://run402.com/schemas/manifest.v1.json`,
      );
    }
    for (const t of policy.tables) {
      if (tablesByName.has(t.table)) {
        throw new Error(
          `Table '${t.table}' appears in more than one policy block. The new manifest allows ONE policy per table — migrate this rls.json to manifest v1 with 'policy: "custom"' and a hand-rolled SQL block for the stacked semantics.`,
        );
      }
      const entry = { name: t.table, expose: true, policy: newTemplate };
      if (newTemplate === "user_owns_rows") {
        if (!t.owner_column) {
          throw new Error(`Table '${t.table}' uses 'user_owns_rows' but is missing 'owner_column'.`);
        }
        entry.owner_column = t.owner_column;
      }
      if (newTemplate === "public_read_write_UNRESTRICTED") {
        entry.i_understand_this_is_unrestricted = true;
      }
      tablesByName.set(t.table, entry);
    }
  }
  return { version: "1", tables: Array.from(tablesByName.values()) };
}

let manifest;
if (raw.version === "1" && Array.isArray(raw.tables)) {
  manifest = raw;
} else if (Array.isArray(raw.policies)) {
  if (raw.policies.length === 0) {
    console.log("No RLS policies to apply");
    process.exit(0);
  }
  try {
    manifest = legacyToManifest(raw);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
} else {
  console.error("rls.json is neither manifest v1 nor legacy format. See https://run402.com/schemas/manifest.v1.json");
  process.exit(1);
}

// The gateway's manifest validator (shared between v2 deploy and the
// imperative /expose endpoint per run402-private#142) rejects extra
// top-level keys like `$schema` and `notes`. Strip to canonical fields.
manifest = {
  version: manifest.version ?? "1",
  tables: manifest.tables ?? [],
  views: manifest.views ?? [],
  rpcs: manifest.rpcs ?? [],
};

const tableCount = manifest.tables.length;
console.log(`Applying manifest with ${tableCount} table entr${tableCount === 1 ? "y" : "ies"} to project ${env.PROJECT_ID}...`);
for (const t of manifest.tables) {
  const detail = t.policy === "user_owns_rows" ? ` (owner=${t.owner_column})` : t.policy === "custom" ? " (custom_sql)" : "";
  console.log(`  ${t.name}: ${t.policy}${detail}`);
}

const r = getClient();
try {
  // SDK 2.0.0: public hero is `(await r.project(id)).apply(spec)`.
  const p = await r.project(env.PROJECT_ID);
  const result = await p.apply(
    {
      database: { expose: manifest },
    },
    {
      onEvent: (event) => {
        if (event.type === "commit.phase" && event.status !== "started") {
          console.log(`  ${event.phase}: ${event.status}`);
        }
      },
    },
  );
  console.log(`\nManifest applied. release_id=${result.release_id}`);
} catch (err) {
  if (err instanceof Run402DeployError) {
    console.error(`Deploy failed [${err.code}]: ${err.message}`);
    if (err.fix) console.error("Fix:", JSON.stringify(err.fix, null, 2));
  } else {
    console.error(`Apply failed: ${err.message}`);
  }
  process.exit(1);
}
