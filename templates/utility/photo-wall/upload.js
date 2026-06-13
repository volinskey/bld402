import { getUser, assets } from '@run402/functions';

// Photo-wall upload handler.
//
// Browser uploads flow through this function: it authenticates the caller,
// validates the file, and uploads via `assets.put` using the function's
// bundled `RUN402_SERVICE_KEY`.
//
// Browser side: POST multipart/form-data to `/functions/v1/upload` with
// fields `file` (the binary) and the user's `Authorization: Bearer <jwt>`
// header. Response: `{ key, cdnUrl, sha256 }`. Store `key` in
// `photos.image_path` — the browser reads it back via
// `GET <API_URL>/storage/v1/blob/<key>` (public blobs need no auth).

const MAX_BYTES = 5 * 1024 * 1024;
const BUCKET = 'photos';

export default async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Auth required — photo-wall writes are owner-scoped (RLS enforces
  // user_id = auth.uid() on the photos table). The upload function mirrors
  // that constraint: the caller must be a logged-in user.
  const user = await getUser(req);
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
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
    return Response.json({ error: 'File too large (max 5 MiB)' }, { status: 413 });
  }

  const contentType = file.type || 'application/octet-stream';
  if (!contentType.startsWith('image/')) {
    return Response.json({ error: 'Only image/* uploads are accepted' }, { status: 415 });
  }

  const safeName = (file.name || 'upload').replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 80);
  const key = `${BUCKET}/${user.id}/${Date.now()}-${safeName}`;

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
