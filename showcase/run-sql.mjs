#!/usr/bin/env node
/**
 * Run a SQL file against a showcase app's run402 project, via @run402/sdk.
 *
 * Usage:
 *   node showcase/run-sql.mjs <app-name> <sql-file> [migration-id]
 *
 * The SDK has no raw-SQL endpoint — SQL flows through the unified deploy
 * primitive as a registered migration. The migration `id` defaults to the
 * file's basename (e.g. `schema.sql` → `schema`) but can be overridden via
 * the third argument. Migration ids are stable: same id + same SQL is a
 * no-op, same id + different SQL is a hard error (the gateway protects
 * against accidental drift). To apply edited SQL, pass a fresh id:
 *
 *   node showcase/run-sql.mjs todo schema.sql               # id="schema"
 *   node showcase/run-sql.mjs todo schema.sql 002_add_col   # id="002_add_col"
 */
import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";
import { Run402DeployError } from "@run402/sdk";
import { getClient, loadEnv } from "./_sdk.mjs";

const appName = process.argv[2];
const sqlFile = process.argv[3];
const migrationIdArg = process.argv[4];

if (!appName || !sqlFile) {
  console.error("Usage: node showcase/run-sql.mjs <app-name> <sql-file> [migration-id]");
  process.exit(1);
}

const env = loadEnv(appName);
const sql = readFileSync(sqlFile, "utf-8");
const migrationId = migrationIdArg ?? basename(sqlFile, extname(sqlFile));

const r = getClient();
console.log(`Applying migration '${migrationId}' (${sqlFile}) to project ${env.PROJECT_ID}...`);

try {
  const result = await r.deploy.apply(
    {
      project: env.PROJECT_ID,
      database: { migrations: [{ id: migrationId, sql }] },
    },
    {
      onEvent: (event) => {
        if (event.type === "commit.phase" && event.status !== "started") {
          console.log(`  ${event.phase}: ${event.status}`);
        }
        if (event.type === "log") {
          console.log(`  [${event.resource}/${event.stream}] ${event.line}`);
        }
      },
    },
  );
  console.log(`\nMigration applied. release_id=${result.release_id}`);
} catch (err) {
  if (err instanceof Run402DeployError) {
    console.error(`Deploy failed [${err.code}]: ${err.message}`);
    if (err.code === "MIGRATION_CHECKSUM_MISMATCH") {
      console.error(
        `\nThe SQL file changed since migration '${migrationId}' was first applied. To apply the new SQL, pass a fresh migration id:`,
      );
      console.error(`  node showcase/run-sql.mjs ${appName} ${sqlFile} <new-id>`);
    } else if (err.fix) {
      console.error("Fix:", JSON.stringify(err.fix, null, 2));
    }
  } else {
    console.error(`SQL apply failed: ${err.message}`);
  }
  process.exit(1);
}
