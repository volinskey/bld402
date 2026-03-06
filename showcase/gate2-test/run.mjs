#!/usr/bin/env node
/**
 * Gate 2 — Build-from-scratch validation for all 6 MVP templates.
 *
 * For each template this script:
 *   1. Provisions a fresh run402 project (x402 payment)
 *   2. Runs the template's schema.sql
 *   3. Applies RLS per the template's rls.json
 *   4. (paste-locker only) Deploys server-side functions
 *   5. Deploys the template's index.html with placeholder substitution
 *   6. Claims a test subdomain
 *   7. Verifies: HTTP 200, content checks, API write/read checks
 *   8. Nukes the project (storage, subdomains, archive)
 *   9. Outputs evidence JSON
 *
 * Usage:
 *   node showcase/gate2-test/run.mjs                    # Run all 6 templates
 *   node showcase/gate2-test/run.mjs shared-todo        # Run one template
 *
 * Evidence output: showcase/gate2-test/evidence.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { toClientEvmSigner } from "@x402/evm";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const SHOWCASE_DIR = join(__dirname, "..");
const WALLET_FILE = join(SHOWCASE_DIR, ".wallet");
const API_URL = "https://api.run402.com";
const EVIDENCE_FILE = join(__dirname, "evidence.json");

// ── Template definitions ────────────────────────────────────────
const TEMPLATES = [
  {
    name: "shared-todo",
    dir: "templates/utility/shared-todo",
    testSubdomain: "gate2-todo",
    contentChecks: ["{{APP_NAME}}", "Shared Todo", "todo", "Add", "bld402"],
    htmlChecks: ["input", "button"],
    apiTable: "todos",
    apiWritePayload: { task: "Gate 2 test task", done: false },
    apiReadCheck: (rows) => rows.some(r => r.task === "Gate 2 test task"),
  },
  {
    name: "landing-waitlist",
    dir: "templates/utility/landing-waitlist",
    testSubdomain: "gate2-waitlist",
    contentChecks: ["email", "signup", "bld402"],
    htmlChecks: ["input", "button"],
    apiTable: "signups",
    apiWritePayload: { email: "gate2test@example.com" },
    apiReadCheck: (rows) => rows.some(r => r.email === "gate2test@example.com"),
  },
  {
    name: "hangman",
    dir: "templates/games/hangman",
    testSubdomain: "gate2-hangman",
    contentChecks: ["Hangman", "bld402"],
    htmlChecks: ["svg", "button"],
    apiTable: "words",
    apiWritePayload: null, // schema has seed data, just read
    apiReadCheck: (rows) => rows.length >= 50,
  },
  {
    name: "trivia-night",
    dir: "templates/games/trivia-night",
    testSubdomain: "gate2-trivia",
    contentChecks: ["Trivia", "bld402"],
    htmlChecks: ["button"],
    apiTable: "rooms",
    apiWritePayload: { code: "9999", host_name: "Gate2Test", status: "lobby" },
    apiReadCheck: (rows) => rows.some(r => r.code === "9999"),
  },
  {
    name: "voting-booth",
    dir: "templates/utility/voting-booth",
    testSubdomain: "gate2-vote",
    contentChecks: ["Voting", "bld402"],
    htmlChecks: ["button"],
    apiTable: "polls",
    apiWritePayload: { title: "Gate 2 Test Poll", description: "Testing" },
    apiReadCheck: (rows) => rows.some(r => r.title === "Gate 2 Test Poll"),
  },
  {
    name: "paste-locker",
    dir: "templates/utility/paste-locker",
    testSubdomain: "gate2-paste",
    contentChecks: ["Paste Locker", "bld402"],
    htmlChecks: ["textarea", "button"],
    hasFunctions: true,
    functions: [
      { name: "create-note", file: "templates/utility/paste-locker/create-note.js" },
      { name: "read-note", file: "templates/utility/paste-locker/read-note.js" },
    ],
    // paste-locker doesn't use direct table access (no RLS = no anon access)
    apiTable: null,
    apiWritePayload: null,
    apiReadCheck: null,
  },
];

// ── Wallet setup ────────────────────────────────────────────────
let privateKey;
if (existsSync(WALLET_FILE)) {
  privateKey = readFileSync(WALLET_FILE, "utf-8").trim();
  console.log("Loaded existing wallet from showcase/.wallet");
} else {
  privateKey = generatePrivateKey();
  writeFileSync(WALLET_FILE, privateKey, "utf-8");
  console.log("Created new wallet, saved to showcase/.wallet");
}

const account = privateKeyToAccount(privateKey);
console.log("Wallet address:", account.address);

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});
const signer = toClientEvmSigner(account, publicClient);
const client = new x402Client();
client.register("eip155:84532", new ExactEvmScheme(signer));
const fetchPaid = wrapFetchWithPayment(fetch, client);

// ── Faucet ──────────────────────────────────────────────────────
async function ensureFaucet() {
  console.log("\nRequesting testnet USDC from faucet...");
  try {
    const res = await fetch(`${API_URL}/v1/faucet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: account.address }),
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`Faucet: ${data.amount} ${data.token} on ${data.network}`);
      console.log("Waiting 5s for faucet tx to settle...");
      await new Promise(r => setTimeout(r, 5000));
    } else if (res.status === 429) {
      console.log("Faucet rate-limited — wallet already funded");
    } else {
      console.log(`Faucet returned ${res.status} — continuing with existing balance`);
    }
  } catch (err) {
    console.log("Faucet request failed:", err.message, "— continuing");
  }
}

// ── Provision project ───────────────────────────────────────────
async function provisionProject(name) {
  console.log(`\nProvisioning project: bld402-gate2-${name}...`);
  const res = await fetchPaid(`${API_URL}/v1/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: `bld402-gate2-${name}` }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Provision failed (${res.status}): ${text}`);
  }
  const project = await res.json();
  console.log("  project_id:", project.project_id);
  console.log("  anon_key:", project.anon_key?.substring(0, 20) + "...");
  return project;
}

// ── Run SQL ─────────────────────────────────────────────────────
async function runSQL(projectId, serviceKey, sqlFile, label) {
  const sql = readFileSync(join(ROOT, sqlFile), "utf-8");
  console.log(`Running ${label || sqlFile}...`);
  const res = await fetch(`${API_URL}/admin/v1/projects/${projectId}/sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ sql }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SQL failed (${res.status}): ${text}`);
  }
  const result = await res.json();
  console.log(`  SQL OK — rows: ${result.rowCount ?? "n/a"}`);
  return result;
}

// ── Apply RLS ───────────────────────────────────────────────────
async function applyRLS(projectId, serviceKey, rlsFile) {
  const rls = JSON.parse(readFileSync(join(ROOT, rlsFile), "utf-8"));
  if (!rls.policies || rls.policies.length === 0) {
    console.log("  No RLS policies to apply (access via functions only)");
    return { skipped: true };
  }
  const results = [];
  for (const policy of rls.policies) {
    console.log(`  Applying RLS template '${policy.template}' to tables: ${policy.tables.map(t => t.table).join(", ")}...`);
    const res = await fetch(`${API_URL}/admin/v1/projects/${projectId}/rls`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        template: policy.template,
        tables: policy.tables,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`RLS failed (${res.status}): ${text}`);
    }
    const result = await res.json();
    console.log(`  RLS OK — ${result.template}: ${JSON.stringify(result.tables)}`);
    results.push(result);
  }
  return results;
}

// ── Deploy functions (paste-locker) ─────────────────────────────
async function deployFunctions(projectId, serviceKey, functions) {
  const results = [];
  for (const fn of functions) {
    console.log(`  Deploying function: ${fn.name}...`);
    const code = readFileSync(join(ROOT, fn.file), "utf-8");
    const res = await fetch(`${API_URL}/admin/v1/projects/${projectId}/functions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        name: fn.name,
        code,
        deps: ["bcryptjs", "zod"],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Function deploy failed (${res.status}): ${text}`);
    }
    const result = await res.json();
    console.log(`  Function OK — url: ${result.url}, status: ${result.status}`);
    results.push(result);
  }
  return results;
}

// ── Deploy HTML ─────────────────────────────────────────────────
async function deployHTML(projectId, anonKey, serviceKey, templateDir, subdomain) {
  const htmlPath = join(ROOT, templateDir, "index.html");
  let html = readFileSync(htmlPath, "utf-8");
  html = html.replace(/\{\{API_URL\}\}/g, API_URL);
  html = html.replace(/\{\{ANON_KEY\}\}/g, anonKey);
  html = html.replace(/\{\{PROJECT_ID\}\}/g, projectId);
  html = html.replace(/\{\{APP_NAME\}\}/g, "Gate 2 Test");

  console.log(`Deploying HTML from ${templateDir}/index.html...`);
  const deployRes = await fetchPaid(`${API_URL}/v1/deployments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `bld402-gate2-${subdomain}`,
      project: projectId,
      files: [{ file: "index.html", data: html, encoding: "utf-8" }],
    }),
  });
  if (!deployRes.ok) {
    const text = await deployRes.text();
    throw new Error(`Deploy failed (${deployRes.status}): ${text}`);
  }
  const deployment = await deployRes.json();
  console.log("  deployment_id:", deployment.id);
  console.log("  url:", deployment.url);

  // Claim subdomain
  let subdomainUrl = null;
  console.log(`  Claiming subdomain '${subdomain}'...`);
  const subRes = await fetch(`${API_URL}/v1/subdomains`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ name: subdomain, deployment_id: deployment.id }),
  });
  if (subRes.ok) {
    const sub = await subRes.json();
    subdomainUrl = sub.url;
    console.log("  subdomain_url:", subdomainUrl);
  } else {
    const text = await subRes.text();
    console.log(`  Subdomain claim failed (${subRes.status}): ${text}`);
    console.log("  Falling back to raw deployment URL");
  }

  return {
    deployment_id: deployment.id,
    deployment_url: deployment.url,
    subdomain_url: subdomainUrl,
    live_url: subdomainUrl || deployment.url,
  };
}

// ── Verify deployment ───────────────────────────────────────────
async function verifyDeployment(liveUrl, template) {
  const checks = [];

  // Check 1: HTTP 200
  console.log(`  Checking HTTP 200 at ${liveUrl}...`);
  const res = await fetch(liveUrl);
  const status = res.status;
  const html = await res.text();
  checks.push({
    check: "HTTP 200",
    passed: status === 200,
    detail: `Status: ${status}`,
  });

  // Check 2: Content checks (case-insensitive search in HTML)
  const htmlLower = html.toLowerCase();
  for (const term of template.contentChecks) {
    const searchTerm = term.replace("{{APP_NAME}}", "Gate 2 Test").toLowerCase();
    const found = htmlLower.includes(searchTerm);
    checks.push({
      check: `Content: "${term}"`,
      passed: found,
      detail: found ? "Found" : "Not found",
    });
  }

  // Check 3: HTML element checks
  for (const el of template.htmlChecks) {
    const found = htmlLower.includes(`<${el}`);
    checks.push({
      check: `HTML element: <${el}>`,
      passed: found,
      detail: found ? "Found" : "Not found",
    });
  }

  return checks;
}

// ── API verification (write + read via REST) ────────────────────
async function verifyAPI(projectId, anonKey, template) {
  const checks = [];

  if (!template.apiTable) {
    checks.push({
      check: "API: no direct table access (functions only)",
      passed: true,
      detail: "Skipped — access via server functions",
    });
    return checks;
  }

  const headers = {
    "Content-Type": "application/json",
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };

  // Write test (if applicable)
  if (template.apiWritePayload) {
    console.log(`  API write to ${template.apiTable}...`);
    const writeRes = await fetch(
      `${API_URL}/rest/v1/${template.apiTable}`,
      {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(template.apiWritePayload),
      }
    );
    const writeStatus = writeRes.status;
    checks.push({
      check: `API write to ${template.apiTable}`,
      passed: writeStatus === 201,
      detail: `Status: ${writeStatus}`,
    });
  }

  // Read test
  console.log(`  API read from ${template.apiTable}...`);
  const readRes = await fetch(
    `${API_URL}/rest/v1/${template.apiTable}?select=*`,
    { headers }
  );
  if (readRes.ok) {
    const rows = await readRes.json();
    const passed = template.apiReadCheck(rows);
    checks.push({
      check: `API read from ${template.apiTable}`,
      passed,
      detail: `${rows.length} rows returned, check ${passed ? "passed" : "FAILED"}`,
    });
  } else {
    checks.push({
      check: `API read from ${template.apiTable}`,
      passed: false,
      detail: `Status: ${readRes.status}`,
    });
  }

  return checks;
}

// ── Paste-locker function verification ──────────────────────────
async function verifyPasteLockerFunctions(projectId, anonKey) {
  const checks = [];
  const headers = {
    "Content-Type": "application/json",
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };

  // Create a note
  console.log("  Testing create-note function...");
  const createRes = await fetch(`${API_URL}/functions/v1/create-note`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      title: "Gate 2 Test Note",
      content: "This is a Gate 2 test note.",
      password: "testpass123",
      burn_after_read: false,
    }),
  });
  const createStatus = createRes.status;
  let noteCode = null;
  if (createRes.ok || createStatus === 201) {
    const data = await createRes.json();
    noteCode = data.code;
    checks.push({
      check: "Function: create-note",
      passed: true,
      detail: `Status: ${createStatus}, code: ${noteCode}`,
    });
  } else {
    const text = await createRes.text();
    checks.push({
      check: "Function: create-note",
      passed: false,
      detail: `Status: ${createStatus}: ${text}`,
    });
  }

  if (noteCode) {
    // Read with correct password
    console.log("  Testing read-note with correct password...");
    const readRes = await fetch(`${API_URL}/functions/v1/read-note`, {
      method: "POST",
      headers,
      body: JSON.stringify({ code: noteCode, password: "testpass123" }),
    });
    const readStatus = readRes.status;
    if (readRes.ok) {
      const data = await readRes.json();
      checks.push({
        check: "Function: read-note (correct password)",
        passed: data.content === "This is a Gate 2 test note.",
        detail: `Status: ${readStatus}, content match: ${data.content === "This is a Gate 2 test note."}`,
      });
    } else {
      checks.push({
        check: "Function: read-note (correct password)",
        passed: false,
        detail: `Status: ${readStatus}`,
      });
    }

    // Read with wrong password
    console.log("  Testing read-note with wrong password...");
    const wrongRes = await fetch(`${API_URL}/functions/v1/read-note`, {
      method: "POST",
      headers,
      body: JSON.stringify({ code: noteCode, password: "wrongpass" }),
    });
    checks.push({
      check: "Function: read-note (wrong password = 403)",
      passed: wrongRes.status === 403,
      detail: `Status: ${wrongRes.status}`,
    });
  }

  return checks;
}

// ── Nuke project ────────────────────────────────────────────────
async function nukeProject(projectId, serviceKey) {
  console.log(`\nNuking project ${projectId}...`);
  const checks = [];

  // Release subdomains
  try {
    const subRes = await fetch(`${API_URL}/v1/subdomains`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });
    if (subRes.ok) {
      const subs = await subRes.json();
      if (Array.isArray(subs)) {
        for (const sub of subs) {
          const name = sub.name || sub.subdomain;
          if (name) {
            await fetch(`${API_URL}/v1/subdomains/${name}`, {
              method: "DELETE",
              headers: {
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
              },
            });
            console.log(`  Released subdomain: ${name}`);
          }
        }
      }
    }
  } catch (err) {
    console.log("  Subdomain release error:", err.message);
  }

  // Archive project
  const archiveRes = await fetch(`${API_URL}/v1/projects/${projectId}`, {
    method: "DELETE",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  const archiveStatus = archiveRes.status;
  let archiveText = "";
  try { archiveText = await archiveRes.text(); } catch {}
  const archived = archiveStatus === 200 || archiveText.includes("archived");
  checks.push({
    check: "Project archived",
    passed: archived,
    detail: `Status: ${archiveStatus}, response: ${archiveText.substring(0, 200)}`,
  });
  console.log(`  Archive: ${archived ? "OK" : "FAILED"} (${archiveStatus})`);

  return checks;
}

// ── Main test loop ──────────────────────────────────────────────
async function runGate2(templateFilter) {
  const templates = templateFilter
    ? TEMPLATES.filter(t => t.name === templateFilter)
    : TEMPLATES;

  if (templates.length === 0) {
    console.error(`No template found matching: ${templateFilter}`);
    console.error("Available:", TEMPLATES.map(t => t.name).join(", "));
    process.exit(1);
  }

  // Ensure wallet is funded
  await ensureFaucet();

  const evidence = {
    timestamp: new Date().toISOString(),
    wallet: account.address,
    templates: [],
  };

  for (const template of templates) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`GATE 2: ${template.name}`);
    console.log("=".repeat(60));

    const entry = {
      name: template.name,
      test_id: `T-${66 + TEMPLATES.indexOf(template)}`,
      project_id: null,
      deployment_id: null,
      live_url: null,
      subdomain: template.testSubdomain,
      checks: [],
      verdict: "PENDING",
      error: null,
    };

    try {
      // 1. Provision
      const project = await provisionProject(template.name);
      entry.project_id = project.project_id;

      // 2. Run schema.sql
      await runSQL(
        project.project_id,
        project.service_key,
        `${template.dir}/schema.sql`,
        `${template.name} schema.sql`
      );

      // 3. Apply RLS
      await applyRLS(
        project.project_id,
        project.service_key,
        `${template.dir}/rls.json`
      );

      // 4. Deploy functions (paste-locker only)
      if (template.hasFunctions) {
        console.log("Deploying server-side functions...");
        await deployFunctions(
          project.project_id,
          project.service_key,
          template.functions
        );
      }

      // 5. Deploy HTML + claim subdomain
      const deploy = await deployHTML(
        project.project_id,
        project.anon_key,
        project.service_key,
        template.dir,
        template.testSubdomain
      );
      entry.deployment_id = deploy.deployment_id;
      entry.live_url = deploy.live_url;

      // Wait for deployment to propagate
      console.log("  Waiting 3s for deployment propagation...");
      await new Promise(r => setTimeout(r, 3000));

      // 6. Verify deployment (HTTP + content)
      console.log("Verifying deployment...");
      const deployChecks = await verifyDeployment(deploy.live_url, template);
      entry.checks.push(...deployChecks);

      // 7. Verify API (write + read)
      console.log("Verifying API access...");
      if (template.name === "paste-locker") {
        const fnChecks = await verifyPasteLockerFunctions(
          project.project_id,
          project.anon_key
        );
        entry.checks.push(...fnChecks);
      } else {
        const apiChecks = await verifyAPI(
          project.project_id,
          project.anon_key,
          template
        );
        entry.checks.push(...apiChecks);
      }

      // 8. Nuke project
      const nukeChecks = await nukeProject(
        project.project_id,
        project.service_key
      );
      entry.checks.push(...nukeChecks);

      // Verdict
      const allPassed = entry.checks.every(c => c.passed);
      entry.verdict = allPassed ? "PASS" : "PARTIAL";

    } catch (err) {
      entry.error = err.message;
      entry.verdict = "FAIL";
      console.error(`\nERROR: ${err.message}`);

      // Try to nuke even on failure
      if (entry.project_id) {
        try {
          // We need the service key — but we lost it. Try to clean up anyway.
          console.log("Attempting cleanup despite error...");
        } catch {}
      }
    }

    evidence.templates.push(entry);

    // Print summary
    console.log(`\n--- ${template.name} SUMMARY ---`);
    console.log(`Verdict: ${entry.verdict}`);
    for (const c of entry.checks) {
      console.log(`  ${c.passed ? "PASS" : "FAIL"} | ${c.check} | ${c.detail}`);
    }
    if (entry.error) console.log(`  ERROR: ${entry.error}`);
  }

  // Save evidence
  writeFileSync(EVIDENCE_FILE, JSON.stringify(evidence, null, 2), "utf-8");
  console.log(`\nEvidence saved to: ${EVIDENCE_FILE}`);

  // Final summary
  console.log("\n" + "=".repeat(60));
  console.log("GATE 2 FINAL SUMMARY");
  console.log("=".repeat(60));
  for (const t of evidence.templates) {
    const passCount = t.checks.filter(c => c.passed).length;
    const totalCount = t.checks.length;
    console.log(`  ${t.verdict.padEnd(8)} | ${t.name.padEnd(20)} | ${passCount}/${totalCount} checks | ${t.test_id}`);
  }

  const allPass = evidence.templates.every(t => t.verdict === "PASS");
  console.log(`\nOverall: ${allPass ? "ALL PASS" : "SOME FAILURES"}`);
  return evidence;
}

// ── Run ─────────────────────────────────────────────────────────
const filter = process.argv[2] || null;
const evidence = await runGate2(filter);
process.exit(evidence.templates.every(t => t.verdict === "PASS") ? 0 : 1);
