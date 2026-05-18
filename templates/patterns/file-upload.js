/**
 * run402 File Upload Pattern (content-addressed CDN)
 *
 * Provides: upload, read, list, delete files via run402's content-addressed
 * storage. The legacy `/storage/v1/object/:bucket/*` endpoints are GONE
 * (return 404) — bytes go through presigned PUT now, and every blob's
 * download URL is content-addressed (immutable; SHA-256 baked into the URL).
 *
 * Requires: db-connection.js (CONFIG with API_URL and ANON_KEY).
 *
 * Server-side path (Node, @run402/sdk ^2.0.0):
 *   import { run402 } from "@run402/sdk/node";
 *   const r = run402();
 *   const p = await r.project(projectId);
 *   const ref = await p.assets.put("logo.png", { bytes });
 *   // ref.cdnUrl is the paste-and-go content-addressed URL
 *   // (`r.blobs` was renamed to `r.assets` in SDK 2.0)
 *
 * The client-side helpers below talk directly to the gateway from the
 * browser. Writes require `service_key` (CORS is intentionally open for
 * x402 — never embed `service_key` in user-visible code; perform writes
 * from a deployed function or have the user log in and route through it).
 */

// === Compute SHA-256 of a Blob/File (required by the uploads API) ===

async function sha256OfFile(file) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// === Upload File (two-step: register → PUT → finalize) ===
// Returns { key, sha256, cdnUrl } — cdnUrl is content-addressed (immutable).
// Requires serviceKey for the register/finalize steps. Anonymous browser
// uploads are not supported.

async function uploadFile(name, file, serviceKey) {
  const size = file.size;
  const sha256 = await sha256OfFile(file);

  // 1) Register the upload — returns a presigned PUT URL
  const reg = await fetch(CONFIG.API_URL + '/storage/v1/uploads', {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      size,
      sha256,
      content_type: file.type || 'application/octet-stream',
    }),
  });
  if (!reg.ok) throw new Error('Register upload failed: ' + (await reg.text()));
  const { upload_id, presigned_put_url } = await reg.json();

  // 2) PUT the bytes
  const put = await fetch(presigned_put_url, { method: 'PUT', body: file });
  if (!put.ok) throw new Error('PUT failed: ' + put.status);

  // 3) Finalize
  const done = await fetch(CONFIG.API_URL + '/storage/v1/uploads/' + upload_id + '/complete', {
    method: 'POST',
    headers: { 'apikey': serviceKey },
  });
  if (!done.ok) throw new Error('Finalize failed: ' + (await done.text()));
  return done.json();  // { key, sha256, cdnUrl, ... }
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
// Attach to an <input type="file"> element for easy upload. Pass `serviceKey`
// (NOT anon_key) — uploads are admin-authenticated. For a public-facing app,
// route uploads through a deployed function that holds the service_key
// server-side; never embed service_key in user-visible code.

function setupFileInput(inputId, serviceKey, onUploaded) {
  const input = document.getElementById(inputId);
  if (!input) return;

  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const safeName = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const result = await uploadFile(safeName, file, serviceKey);
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
