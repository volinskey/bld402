import { getUser, assets } from '@run402/functions';

// Micro-blog upload handler.
//
// Browser uploads flow through this function. It checks auth, validates, and
// uploads via `assets.put` with the function's bundled `RUN402_SERVICE_KEY`.
// The browser stores the returned `key` in `posts.image_path` and reads it back via
// `GET <API_URL>/storage/v1/blob/<key>` (no auth required for public blobs).

const MAX_BYTES = 5 * 1024 * 1024;
const BUCKET = 'posts';

export default async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  // RLS on `posts` is owner-scoped (user_id = auth.uid()), so the upload is
  // gated on the same JWT.
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
