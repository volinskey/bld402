/**
 * run402 Serverless Functions Pattern
 *
 * Provides: invoke deployed Node 22 Fetch functions from client-side code.
 * Requires: db-connection.js (CONFIG with API_URL and ANON_KEY).
 *
 * Functions are invoked via: ALL /functions/v1/:name[/*]   (apikey-protected)
 * Or via same-origin web routes (`routes.replace` in the deploy spec) — those
 * are reachable from the static site at paths like /admin or /api/* without
 * the apikey header (the gateway proxies the call).
 *
 * Deploy path (PREFERRED — declarative, atomic with the rest of the release).
 * SDK 2.0+ uses the project-scoped hero:
 *
 *   import { run402 } from "@run402/sdk/node";
 *   const r = run402();
 *   const p = await r.project(PROJECT_ID);   // async — scopes the client
 *   await p.apply({
 *     functions: {
 *       replace: {
 *         "draw-names": { source: fs.readFileSync("draw-names.js", "utf-8") }
 *       }
 *     }
 *   });
 *
 * Imperative escape hatch: `POST /projects/v1/admin/:id/functions` with the
 * service_key (lifecycle-gated). Function shape: Node 22 Fetch handler
 * (`export default async (req: Request) => Response`); the old AWS-Lambda
 * `module.exports.handler` shape is rejected at deploy time.
 */

// === Invoke a Function ===
// Calls a deployed function by name.
// body: object to send as JSON (or null for GET-style calls).
// options.serviceKey: pass service_key to bypass RLS (for admin operations).
// options.method: HTTP method (default POST).
// options.path: extra path segments appended after function name.

async function callFunction(name, body = null, options = {}) {
  const method = options.method || 'POST';
  const path = options.path ? '/' + options.path : '';
  const url = CONFIG.API_URL + '/functions/v1/' + name + path;

  const headers = {
    'apikey': CONFIG.ANON_KEY,
    'Content-Type': 'application/json'
  };

  // Use service_key for server-side operations that bypass RLS
  if (options.serviceKey) {
    headers['Authorization'] = 'Bearer ' + options.serviceKey;
  }

  // Add user auth token if logged in (for user-scoped functions)
  const token = localStorage.getItem('access_token');
  if (token && !options.serviceKey) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  const fetchOptions = { method, headers };
  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  const res = await fetch(url, fetchOptions);

  // Parse response
  const contentType = res.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const err = new Error(
      (typeof data === 'object' && data.error) ? data.error : data || 'Function call failed'
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// === Deploy a Function (Agent Use Only — prefer p.apply with functions.replace) ===
// This is used during the build process, NOT in deployed app code.
// The imperative endpoint deploys a single function via the admin API.
// For atomic multi-resource deploys, use (await r.project(id)).apply
// with functions.replace.
//
// functionCode: string of JavaScript (Node 22 Fetch handler — must export default
//   an async (req: Request) => Response function)
// functionName: name used to invoke it (e.g., 'draw-names')
// serviceKey: project service_key for admin auth
// projectId: project ID (e.g., 'prj_...')

async function deployFunction(functionName, functionCode, serviceKey, projectId) {
  const res = await fetch(CONFIG.API_URL + '/projects/v1/admin/' + projectId + '/functions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + serviceKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: functionName,
      code: functionCode
    })
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error('Deploy failed: ' + error);
  }

  return res.json();
}

// === Set Function Secrets (Agent Use Only) ===
// Store environment variables accessible to the function at runtime.
// Values are encrypted at rest via AWS KMS. 4 KiB UTF-8 cap per value.
// Keys must match ^[A-Z_][A-Z0-9_]{0,127}$.

async function setSecret(key, value, serviceKey, projectId) {
  const res = await fetch(CONFIG.API_URL + '/projects/v1/admin/' + projectId + '/secrets', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + serviceKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ key, value })
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error('Set secret failed: ' + error);
  }

  return res.json();
}
