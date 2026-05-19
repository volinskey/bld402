import { adminDb } from '@run402/functions';
import bcrypt from 'bcryptjs';

// `notes` is dark-by-default — this function is the only access path. We use
// `adminDb()` (BYPASSRLS) to read, with access control enforced here
// (password verify + burn-after-read invariants).
export default async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { code, password } = body;
  if (!code || typeof code !== 'string') {
    return Response.json({ error: 'Code is required' }, { status: 400 });
  }

  const db = adminDb();

  const notes = await db.from('notes').select('*').eq('code', code).limit(1);
  if (!notes || notes.length === 0) {
    return Response.json({ error: 'Note not found' }, { status: 404 });
  }

  const note = notes[0];

  if (note.expires_at && new Date(note.expires_at) < new Date()) {
    return Response.json({ error: 'This note has expired' }, { status: 404 });
  }

  if (note.burn_after_read && note.is_read) {
    return Response.json({ error: 'This note has been burned' }, { status: 410 });
  }

  if (note.password_hash) {
    if (!password) {
      return Response.json({ error: 'Password required', needs_password: true }, { status: 403 });
    }
    const valid = await bcrypt.compare(password, note.password_hash);
    if (!valid) {
      return Response.json({ error: 'Wrong password' }, { status: 403 });
    }
  }

  if (note.burn_after_read && !note.is_read) {
    await db.from('notes').update({ is_read: true }).eq('id', note.id);
  }

  return Response.json({
    title: note.title,
    content: note.content_encrypted,
    burn_after_read: note.burn_after_read,
    created_at: note.created_at,
  }, { status: 200 });
};
