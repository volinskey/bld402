#!/usr/bin/env node
/**
 * Deploy server-side functions for the Paste Locker showcase app.
 *
 * Usage:
 *   node showcase/paste-locker/deploy-functions.mjs
 *
 * Uses `r.functions.deploy(projectId, opts)` because the functions need
 * runtime deps (`bcryptjs`, `zod`). Unified deploy (`(await r.project(id)).apply`
 * with `functions.replace`) does NOT accept `deps` — it expects deps bundled
 * into the source. The standalone `r.functions.deploy` path supports deps
 * (npm specs installed at deploy time; pinned or ranged accepted).
 *
 * Both code surfaces hit `POST /projects/v1/admin/:id/functions` under the
 * hood; this script uses the typed SDK method for retries + structured
 * errors. Path order is `/projects/v1/admin/...` (not the legacy
 * `/admin/v1/projects/...` form, which never existed for production).
 */
import { readFileSync } from "node:fs";
import { Run402Error } from "@run402/sdk";
import { getClient, loadEnv } from "../_sdk.mjs";

const env = loadEnv("paste-locker");
const r = getClient();

const functions = [
  { name: "create-note", file: "templates/utility/paste-locker/create-note.js" },
  { name: "read-note",   file: "templates/utility/paste-locker/read-note.js" },
];

for (const fn of functions) {
  console.log(`Deploying function: ${fn.name}...`);
  const code = readFileSync(fn.file, "utf-8");

  try {
    const result = await r.functions.deploy(env.PROJECT_ID, {
      name: fn.name,
      code,
      deps: ["bcryptjs", "zod"],
    });
    console.log(`  Deployed runtime=${result.runtime_version}`);
    if (result.deps_resolved) {
      for (const [pkg, version] of Object.entries(result.deps_resolved)) {
        console.log(`    ${pkg}@${version}`);
      }
    }
    if (result.warnings?.length) {
      for (const w of result.warnings) {
        console.log(`  ⚠ ${w.code}: ${w.message}`);
      }
    }
  } catch (err) {
    if (err instanceof Run402Error) {
      console.error(`  Failed [${err.kind}]: ${err.message}`);
    } else {
      console.error(`  Failed: ${err.message}`);
    }
    process.exit(1);
  }
}

console.log("\nAll functions deployed!");
