/**
 * run402 File Upload Pattern (content-addressed CDN)
 *
 * Provides: upload, read, list, delete files via run402's content-addressed
 * storage. Browser uploads go through a deployed function that calls
 * `assets.put` from `@run402/functions`; every blob's download URL is
 * content-addressed (immutable; SHA-256 baked into the URL).
 *
 * Requires: db-connection.js (CONFIG with API_URL and ANON_KEY) and a
 * deployed `upload` function like the template upload.js handlers.
 *
 * Server-side path (Node, @run402/sdk ^2.0.0):
 *   import { run402 } from "@run402/sdk/node";
 *   const r = run402();
 *   const p = await r.project(projectId);
 *   const ref = await p.assets.put("logo.png", { bytes });
 *   // ref.cdnUrl is the paste-and-go content-addressed URL
 *
 * The client-side helper below talks to that function from the browser.
 * Never embed `service_key` in user-visible code.
 */

// === Upload File ===
// Returns { key, cdnUrl, sha256 } from your upload function.
// The default endpoint is CONFIG.API_URL + /functions/v1/upload.
// Pass { endpoint: "/api/upload" } when using a same-origin web route.

async function uploadFile(name, file, options = {}) {
  const endpoint = options.endpoint || (CONFIG.API_URL + '/functions/v1/' + (options.functionName || 'upload'));
  const form = new FormData();
  form.append('file', file, name);
  form.append('subpath', name);

  const headers = {};
  if (!options.endpoint || endpoint.startsWith(CONFIG.API_URL)) {
    headers.apikey = options.apiKey || CONFIG.ANON_KEY;
  }

  const authToken = options.authToken || localStorage.getItem('access_token');
  if (authToken) headers.Authorization = 'Bearer ' + authToken;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: form,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data && data.error ? data.error : 'Upload failed';
    throw new Error(message);
  }
  return data;
}

// === Read a Blob ===
// Public blobs need no auth. Build the URL: <API_URL>/storage/v1/blob/<key>
// or use the content-addressed cdnUrl returned by uploadFile (preferred —
// served directly from CloudFront, no API hop).

function blobUrl(key) {
  return CONFIG.API_URL + '/storage/v1/blob/' + encodeURIComponent(key);
}

async function downloadFile(key) {
  const res = await fetch(blobUrl(key));
  if (!res.ok) throw new Error('File not found');
  return res;  // Use .blob(), .text(), .arrayBuffer() as needed
}

// === Sign URL for a Private Blob ===

async function getSignedUrl(key, serviceKey, ttlSeconds = 3600) {
  const res = await fetch(CONFIG.API_URL + '/storage/v1/blob/' + encodeURIComponent(key) + '/sign', {
    method: 'POST',
    headers: { 'apikey': serviceKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ttl_seconds: ttlSeconds }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.signed_url;
}

// === List Blobs ===
// Returns { blobs: [{ key, size, sha256, content_type, ... }] }.
// `prefix` filters by key prefix (literal — % and _ are escaped server-side).

async function listFiles(prefix = '', serviceKey) {
  const qs = prefix ? '?prefix=' + encodeURIComponent(prefix) : '';
  return api('/storage/v1/blobs' + qs, {
    headers: { 'apikey': serviceKey },
  });
}

// === Delete Blob ===

async function deleteFile(key, serviceKey) {
  return api('/storage/v1/blob/' + encodeURIComponent(key), {
    method: 'DELETE',
    headers: { 'apikey': serviceKey },
  });
}

// === File Input Helper ===
// Attach to an <input type="file"> element for easy upload. Pass upload
// options such as { endpoint, authToken, apiKey } when needed.

function setupFileInput(inputId, options = {}, onUploaded) {
  if (typeof options === 'function') {
    onUploaded = options;
    options = {};
  }

  const input = document.getElementById(inputId);
  if (!input) return;

  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const safeName = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const result = await uploadFile(safeName, file, options);
      if (onUploaded) onUploaded(result);  // { key, cdnUrl, sha256, ... }
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
  });
}

// === Image Preview Helper ===
// Show an uploaded image inline. Prefer the content-addressed cdnUrl
// returned by uploadFile — it's already paste-and-go.

function showImagePreview(cdnUrlOrKey, imgElementId) {
  const img = document.getElementById(imgElementId);
  if (!img) return;
  img.src = cdnUrlOrKey.startsWith('http')
    ? cdnUrlOrKey
    : blobUrl(cdnUrlOrKey);
}
