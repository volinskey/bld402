/**
 * run402 AI Image Generation Pattern
 *
 * Generates images from text prompts via run402's `POST /generate-image/v1`
 * endpoint. The endpoint is x402-gated ($0.03/image) — bare browsers can't
 * pay, so a deployed function acts as a proxy: it calls the gateway with
 * the project's own credentials and bills the project's allowance.
 *
 * The pre-2.0 pattern required hand-rolling `@x402/fetch` + `@x402/evm` +
 * `viem` inside the function with `WALLET_PRIVATE_KEY` as a secret. The
 * `@run402/functions` `ai.generateImage(...)` helper does all of that
 * server-side via the project's billing — **no wallet, no secrets, just
 * one call**.
 *
 * Requires: db-connection.js (CONFIG), functions.js (callFunction),
 *           file-upload.js / asset upload helper — if saving to storage.
 *
 * Setup (agent does this during build):
 *   1. Include the `generate-image-proxy` function below in your
 *      ReleaseSpec's `functions.replace` (or call `r.functions.deploy`).
 *   2. No secrets needed. Image cost flows through the project's allowance.
 *   3. Client calls `/functions/v1/generate-image-proxy` (apikey-protected)
 *      or a same-origin web route mapped to it.
 */

// === Client-Side: Generate an Image ===
// Calls the server-side proxy function. Returns { image, content_type, aspect }.
// `image` is a base64-encoded payload — use the data-URL helper below to
// render it directly in an <img> tag.

async function generateImage(prompt, aspect) {
  return callFunction('generate-image-proxy', { prompt, aspect });
}

// === Client-Side: Render as a data URL ===

function imageDataUrl(result) {
  return `data:${result.content_type || 'image/png'};base64,${result.image}`;
}

// === Client-Side: Generate and Save to Asset Storage ===
// Generates an image and persists it via the file-upload pattern. The
// uploaded asset is content-addressed (immutable cdnUrl). Requires
// uploadFile from templates/patterns/file-upload.js.

async function generateAndSave(prompt, key, opts = {}) {
  const result = await generateImage(prompt, opts.aspect);

  // Decode base64 → Uint8Array for the upload helper
  const bin = atob(result.image);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const file = new Blob([bytes], { type: result.content_type || 'image/png' });

  // Upload through the app's upload function; see file-upload.js.
  const asset = await uploadFile(key, file, opts.upload || {});

  return {
    prompt,
    aspect: result.aspect,
    cdn_url: asset.cdnUrl ?? asset.url,
    asset,
  };
}

// === UI Helper: Generate with Loading State ===

function setupGenerateUI(promptInputId, generateBtnId, previewImgId, onGenerated) {
  const btn = document.getElementById(generateBtnId);
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const input = document.getElementById(promptInputId);
    const prompt = input.value.trim();
    if (!prompt) return;

    const preview = document.getElementById(previewImgId);
    btn.disabled = true;
    const origText = btn.textContent;
    btn.textContent = 'Generating...';

    try {
      const result = await generateImage(prompt);
      if (preview) {
        preview.src = imageDataUrl(result);
        preview.style.display = '';
      }
      if (onGenerated) onGenerated(result);
    } catch (err) {
      alert('Generation failed: ' + (err.message || 'Unknown error'));
    } finally {
      btn.disabled = false;
      btn.textContent = origText;
    }
  });
}


// ============================================================================
// FUNCTION SOURCE — Deploy this as "generate-image-proxy"
// ============================================================================
//
// Deploy via the unified apply primitive (SDK 2.0+):
//
//   const p = await r.project(PROJECT_ID);
//   await p.apply({
//     functions: {
//       replace: {
//         "generate-image-proxy": { source: fs.readFileSync("generate-image-proxy.js", "utf-8") }
//       }
//     }
//   });
//
// The function body — Node 22 Fetch handler. NO wallet, NO secrets,
// NO @x402/fetch — `ai.generateImage` does it all server-side.
//
// --- Copy below into generate-image-proxy.js ---
//
// import { ai } from "@run402/functions";
//
// export default async (req) => {
//   if (req.method !== "POST") {
//     return Response.json({ error: "Method not allowed" }, { status: 405 });
//   }
//
//   let body;
//   try {
//     body = await req.json();
//   } catch {
//     return Response.json({ error: "Invalid JSON" }, { status: 400 });
//   }
//
//   const { prompt, aspect } = body;
//   if (!prompt || typeof prompt !== "string") {
//     return Response.json({ error: "prompt is required" }, { status: 400 });
//   }
//
//   try {
//     // Costs $0.03 from the project's allowance. The helper uses
//     // RUN402_SERVICE_KEY (baked at deploy time) — no wallet plumbing here.
//     const result = await ai.generateImage({ prompt, aspect });
//     return Response.json(result);
//     // result: { image: "<base64>", content_type: "image/png", aspect: "square" }
//   } catch (err) {
//     // Errors include PaymentRequired (allowance empty), tier limits, etc.
//     return Response.json({ error: err.message }, { status: 500 });
//   }
// };
//
// --- End of function source ---
