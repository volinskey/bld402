import { adminDb } from '@run402/functions';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const schema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(100000),
  password: z.string().min(1).max(200).optional(),
  burn_after_read: z.boolean().optional(),
  expires_in: z.enum(['1h', '24h', '7d']).optional(),
});

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getExpiresAt(expiresIn) {
  if (!expiresIn) return null;
  const now = Date.now();
  const ms = { '1h': 3600000, '24h': 86400000, '7d': 604800000 };
  return new Date(now + ms[expiresIn]).toISOString();
}

// The `notes` table is intentionally NOT exposed via REST (dark-by-default
// — no entry in the expose manifest). This function is the only access path,
// so it uses `adminDb()` (BYPASSRLS) to write directly. Anonymous users can
// create notes; access control is enforced inside this function (password
// hashing + burn-after-read), not via RLS.
export default async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  let body;
  try {
    body = schema.parse(await req.json());
  } catch (err) {
    return Response.json({ error: 'Invalid input', details: err.errors }, { status: 400 });
  }

  const code = generateCode();
  const password_hash = body.password ? await bcrypt.hash(body.password, 10) : null;
  const expires_at = getExpiresAt(body.expires_in);

  const db = adminDb();
  const [note] = await db.from('notes').insert({
    code,
    title: body.title || 'Untitled',
    content_encrypted: body.content,
    password_hash,
    burn_after_read: body.burn_after_read || false,
    expires_at,
  });

  return Response.json({
    code,
    has_password: !!password_hash,
    burn_after_read: body.burn_after_read || false,
  }, { status: 201 });
};
