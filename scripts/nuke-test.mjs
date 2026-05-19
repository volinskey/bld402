#!/usr/bin/env node
/**
 * nuke-test.mjs — fully clean up a run402 test project.
 *
 * Usage:
 *   node scripts/nuke-test.mjs <project_id> <service_key>
 *
 * Refuses to touch the showcase project blocklist. Uses `@run402/sdk` with
 * a service-key-only credentials provider — no wallet needed:
 *   - `r.subdomains.list/delete` to release any custom subdomains.
 *   - `r.projects.delete` for the full destructive cascade (drops the
 *     tenant schema, releases subdomains, deletes functions, tombstones
 *     mailbox, wipes secrets).
 *
 * Idempotent — safe to run multiple times.
 */
import { Run402, ProjectNotFound } from "@run402/sdk";

const SHOWCASE_PROJECTS = new Set([
  // Live showcase projects (re-provisioned May 2026 after subdomain claims lapsed)
  "prj_1779176299046_1785", // shared-todo
  "prj_1779176382060_1786", // landing-waitlist
  "prj_1779176412662_1787", // hangman
  "prj_1779176711075_1789", // trivia-night
  "prj_1779176742335_1790", // voting-booth
  "prj_1779176772520_1791", // paste-locker
  // Legacy showcase IDs (owned by a different wallet, subdomains lapsed) — kept for safety
  "prj_1772702667600_0011", // shared-todo (legacy)
  "prj_1772707206984_0012", // landing-waitlist (legacy)
  "prj_1772707239699_0013", // hangman (legacy)
  "prj_1772707271798_0014", // trivia-night (legacy)
  "prj_1772707305070_0015", // voting-booth (legacy)
  "prj_1772728652516_0019", // paste-locker (legacy)
]);

const projectId = process.argv[2];
const serviceKey = process.argv[3];

if (!projectId || !serviceKey) {
  console.error("Usage: node scripts/nuke-test.mjs <project_id> <service_key>");
  console.error("\nFully cleans up a run402 test project. Refuses to touch showcase projects.");
  process.exit(1);
}

if (SHOWCASE_PROJECTS.has(projectId)) {
  console.error(`BLOCKED: ${projectId} is a showcase project. Cannot delete.`);
  console.error("Showcase projects are live on the site and must never be cleaned up.");
  process.exit(2);
}

console.log(`Nuking test project: ${projectId}`);

// Service-key-only credentials. The SDK's project-scoped admin endpoints
// (subdomains, project delete) only need the project's service_key as a
// Bearer header — no SIWX wallet signing required.
const r = new Run402({
  apiBase: "https://api.run402.com",
  fetch: globalThis.fetch,
  credentials: {
    async getAuth() {
      return null;
    },
    async getProject(id) {
      if (id === projectId) {
        return { anon_key: serviceKey, service_key: serviceKey };
      }
      return null;
    },
  },
});

console.log("\n1. Releasing subdomains...");
try {
  const subs = await r.subdomains.list(projectId);
  if (subs.length === 0) {
    console.log("   None.");
  } else {
    for (const sub of subs) {
      console.log(`   Releasing: ${sub.name}.run402.com`);
      try {
        await r.subdomains.delete(sub.name, { projectId });
      } catch (err) {
        console.log(`     (delete failed: ${err.message})`);
      }
    }
  }
} catch (err) {
  console.log(`   (list failed: ${err.message})`);
}

console.log("\n2. Deleting project (drops schema + storage + functions + secrets + mailbox)...");
try {
  await r.projects.delete(projectId);
  console.log("   Deleted.");
} catch (err) {
  if (err instanceof ProjectNotFound) {
    console.log("   Already gone.");
  } else {
    console.error(`   FAILED: ${err.message}`);
    process.exit(1);
  }
}

console.log(`\nDone. ${projectId} fully cleaned.`);
