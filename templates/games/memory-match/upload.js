import { assets } from '@run402/functions';

// Memory Match upload handler.
//
// The runtime UI does NOT call this function — players don't upload cards;
// card images are seeded once at deploy time. It exists so the seed/admin
// path has a uniform `/functions/v1/upload` surface across all four
// templates (matching photo-wall, micro-blog, ai-sticker-maker). Anything
// that seeds card images goes through a service-key-holding function like this one.
//
// If you don't want admin uploads exposed on the public API, drop this
// file from the function deploy spec — the runtime UI works fine without it.

const MAX_BYTES = 4 * 1024 * 1024;
const BUCKET = 'memory-match';

export default async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  let form;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: 'Expected multipart/form-data body' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: 'Missing "file" field' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: 'File too large (max 4 MiB)' }, { status: 413 });
  }

  // Optional `subpath` field (e.g. "animals/0.png") to control the key
  // layout. Defaults to a timestamped name under the bucket.
  const subpath = form.get('subpath');
  const contentType = file.type || 'application/octet-stream';
  if (!contentType.startsWith('image/')) {
    return Response.json({ error: 'Only image/* uploads are accepted' }, { status: 415 });
  }

  let key;
  if (typeof subpath === 'string' && subpath.length > 0) {
    const cleaned = subpath.replace(/^\/+/, '').replace(/[^a-zA-Z0-9./_-]/g, '_').slice(0, 200);
    key = `${BUCKET}/${cleaned}`;
  } else {
    const ext = (file.name || '').match(/\.[a-zA-Z0-9]+$/)?.[0] || '.png';
    key = `${BUCKET}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    const ref = await assets.put(key, { bytes }, { contentType });
    return Response.json(
      {
        key: ref.key ?? key,
        cdnUrl: ref.cdnUrl ?? null,
        sha256: ref.sha256 ?? null,
      },
      { status: 201 },
    );
  } catch (err) {
    return Response.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
};
