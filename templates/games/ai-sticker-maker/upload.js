import { assets } from '@run402/functions';

// AI sticker maker upload handler.
//
// Anonymous-friendly: the sticker maker is a "no signup, just play" gallery,
// so this function accepts unauthenticated uploads. Bytes flow through this
// function, which holds `RUN402_SERVICE_KEY`.
//
// Browser side: POST multipart/form-data to `/functions/v1/upload` with a
// `file` field. Response: `{ key, cdnUrl, sha256 }`. Store `key` in
// `stickers.image_path` and read back via `GET <API_URL>/storage/v1/blob/<key>`.

const MAX_BYTES = 4 * 1024 * 1024;
const BUCKET = 'stickers';

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

  const contentType = file.type || 'application/octet-stream';
  if (!contentType.startsWith('image/')) {
    return Response.json({ error: 'Only image/* uploads are accepted' }, { status: 415 });
  }

  const ext = (file.name || '').match(/\.[a-zA-Z0-9]+$/)?.[0] || '.png';
  const key = `${BUCKET}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

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
