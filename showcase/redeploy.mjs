#!/usr/bin/env node
/**
 * Redeploy a fixed list of showcase apps via @run402/sdk's unified deploy.
 *
 * Usage:
 *   node showcase/redeploy.mjs
 *
 * Walks each app's directory, substitutes placeholders, and calls
 * `(await r.project(id)).apply` (SDK 2.0+) with site + subdomain in one
 * shot. Subdomain reassignment is part of the deploy state machine — no
 * separate /subdomains call.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Run402DeployError } from "@run402/sdk";
import { API_URL, getClient, loadEnv } from "./_sdk.mjs";

const apps = [
  { name: "photo-wall", dir: "showcase/photo-wall" },
  { name: "ai-sticker-maker", dir: "showcase/ai-sticker-maker" },
  { name: "micro-blog", dir: "showcase/micro-blog" },
  { name: "memory-match", dir: "showcase/memory-match" },
];

const TEXT_EXT = new Set([".html", ".css", ".js", ".svg", ".json", ".txt"]);
const BINARY_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico"]);

function buildFileSet(dir, env) {
  const fileSet = {};
  for (const entry of readdirSync(dir)) {
    const ext = entry.slice(entry.lastIndexOf(".")).toLowerCase();
    const path = join(dir, entry);
    if (TEXT_EXT.has(ext)) {
      let content = readFileSync(path, "utf-8");
      content = content
        .replace(/\{\{API_URL\}\}/g, API_URL)
        .replace(/\{\{ANON_KEY\}\}/g, env.ANON_KEY ?? "")
        .replace(/\{\{PROJECT_ID\}\}/g, env.PROJECT_ID ?? "");
      fileSet[entry] = content;
    } else if (BINARY_EXT.has(ext)) {
      fileSet[entry] = new Uint8Array(readFileSync(path));
    }
  }
  return fileSet;
}

const r = getClient();

for (const app of apps) {
  let env;
  try {
    env = loadEnv(app.name);
  } catch (err) {
    console.log(`${app.name}: SKIP (${err.message})`);
    continue;
  }

  const fileSet = buildFileSet(app.dir, env);
  if (Object.keys(fileSet).length === 0) {
    console.log(`${app.name}: SKIP (no deployable files)`);
    continue;
  }

  try {
    // SDK 2.0.0: public hero is `(await r.project(id)).apply(spec)`.
    const p = await r.project(env.PROJECT_ID);
    const result = await p.apply({
      site: { replace: fileSet },
      ...(env.SUBDOMAIN ? { subdomains: { set: [env.SUBDOMAIN] } } : {}),
    });
    const url = env.SUBDOMAIN
      ? `${env.SUBDOMAIN}.run402.com`
      : (result.urls?.site ?? result.urls?.deployment ?? "(no url)");
    console.log(`${app.name}: deployed release ${result.release_id} → ${url}`);
  } catch (err) {
    if (err instanceof Run402DeployError) {
      console.log(`${app.name}: FAILED [${err.code}] ${err.message}`);
    } else {
      console.log(`${app.name}: FAILED ${err.message}`);
    }
  }
}
