---
product: paste-locker
type: feature
version: "1.0"
template: templates/utility/paste-locker/
---

# Showcase: Paste Locker

Live demo at **paste.run402.com** — a secure pastebin with server-side password hashing via run402 functions.

## Source Template

`templates/utility/paste-locker/` (schema.sql, rls.json, create-note.js, read-note.js, index.html)

The showcase is built FROM this template with demo-specific modifications listed below.

## What This Demo Proves

Paste Locker is the **6th showcase app** and the first to use **run402 server-side functions**. The previous 5 apps (todo, waitlist, hangman, trivia, voting-booth) only used DB + static hosting. Paste Locker demonstrates WHY server-side functions are needed:

- Passwords are hashed with bcrypt on the server — the hash never reaches the browser
- The client cannot bypass the password check because it never sees the `notes` table directly
- All access goes through two server-side functions: `create-note` and `read-note`

## Functional Requirements

### FR-1: Create Note

- **Title** (optional, defaults to "Untitled")
- **Content** (required, textarea)
- **Password** (optional — if set, note requires password to read)
- **Burn after reading** (checkbox — note self-destructs after one read)
- **Expires in** (dropdown: Never, 1 hour, 24 hours, 7 days)
- Submit calls the `create-note` server-side function
- On success, transitions to the Share screen

### FR-2: Share Screen

- Shows the generated 8-character code
- Shows the full shareable URL: `https://paste.run402.com?code=XXXXXXXX`
- Copy button for the URL
- Indicates if note is password-protected and/or burn-after-read
- "Create Another" button returns to create screen

### FR-3: Read Note

- Enter 8-character code (or arrive via `?code=XXXXXXXX` URL parameter)
- If note not found: "Note not found" error
- If note expired: "This note has expired" error
- If note is burn-after-read and already read: "This note has been burned" (410 Gone)
- If note has password: show password input, submit to verify
- If wrong password: "Wrong password" error
- If correct (or no password): display note title + content
- Burn-after-read notes show a warning: "This note will be deleted after you close it"

### FR-4: URL Routing

- `?code=XXXXXXXX` in URL auto-loads the read screen for that code
- No code parameter: show create screen (default)

### FR-5: Demo Banner

- Yellow banner: "Live demo — server-side functions in action! Your password never leaves the server."

### FR-6: How It Works Section

- Always-visible section below the main form explaining why server-side functions matter
- Content:
  > **Why server-side functions?**
  > This app uses run402 server-side functions for password security. When you create a password-protected note:
  > 1. Your password is sent to a server-side function (never stored in plain text)
  > 2. The function hashes it with bcrypt — a one-way algorithm
  > 3. Only the hash is stored in the database
  > 4. When someone reads the note, another server-side function verifies the password against the hash
  >
  > **This can't be done client-side** — if the hash lived in the browser, anyone could bypass the password check. Server-side functions keep secrets safe.

### FR-7: Footer

- "Built with bld402 · Powered by run402" with links.

## Schema

```sql
CREATE TABLE notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text DEFAULT 'Untitled',
  content_encrypted text NOT NULL,
  password_hash text,
  burn_after_read boolean DEFAULT false,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX idx_notes_code ON notes(code);
```

## RLS

```json
{
  "notes": "none"
}
```

**No public RLS at all.** All access goes through server-side functions using the project's `service_key`. This is the key architectural point: the client never directly reads the `notes` table.

## Server-Side Functions

### `create-note` (POST)

```
Input: { title?, content, password?, burn_after_read?, expires_in? }
Process:
  1. Validate with zod
  2. Generate 8-char alphanumeric code
  3. If password: hash with bcryptjs (10 rounds)
  4. Calculate expires_at from expires_in (1h, 24h, 7d, or null)
  5. Insert into notes table via db.from('notes').insert(...)
  6. Return { code, has_password, burn_after_read }
```

### `read-note` (POST)

```
Input: { code, password? }
Process:
  1. Lookup note by code via db
  2. If not found or expired: return 404
  3. If burn_after_read && is_read: return 410 (Gone)
  4. If has password_hash: verify with bcryptjs
     - Wrong password: return 403
  5. If burn_after_read: mark is_read = true
  6. Return { title, content, burn_after_read, created_at }
```

## Seed Data

One demo note pre-loaded:
- Code: `demo1234`
- Title: "Welcome to Paste Locker"
- Content: "This is a demo note. The password is 'demo'. Try creating your own!"
- Password: "demo" (bcrypt hashed)
- No burn-after-read, no expiry

## Pinned Demo Modifications

1. **Project pinned** — lease never expires
2. **Server-side functions deployed** — `create-note` and `read-note` via deploy-functions.mjs
3. **Seed note** — one pre-loaded note with password "demo"
4. **Demo cleanup trigger** — auto-delete notes older than 1 hour (except seed note)
5. **Demo notice banner** — added to HTML
6. **"How it works" section** — explains server-side functions

## Acceptance Criteria

- [ ] Page loads showing the create note form
- [ ] Creating a note without password works — get shareable code — open in new tab — see content
- [ ] Creating a note with password works — try wrong password → rejected — try correct → see content
- [ ] Burn-after-read works — read once → try again → "burned" message
- [ ] Expiry works — create 1h note, verify expires_at is set
- [ ] Demo note accessible with code `demo1234` and password `demo`
- [ ] `?code=demo1234` auto-loads read screen
- [ ] Copy URL button works
- [ ] Demo notice banner visible
- [ ] "How it works" section visible and explains server-side functions
- [ ] Footer shows bld402 + run402 links
- [ ] **Viewport fitting:** Form fits in one screen without page-level scroll (100dvh, flex layout)
- [ ] **Responsive:** Adapts to mobile (< 600px) with reduced padding
- [ ] Page accessible at paste.run402.com
- [ ] **Repeatability:** A fresh project built from `templates/utility/paste-locker/` produces a working pastebin

## Template Repeatability

Anyone following the bld402 steps with this template MUST be able to reach the same functional result. The only differences between a fresh build and the showcase are the pinned demo modifications listed above. The template includes the Lambda function source files that the agent deploys via the functions API.

**Red Team must validate both:**
1. **The live demo** at paste.run402.com — test all acceptance criteria above.
2. **Template completeness** — verify the template includes schema.sql, rls.json, create-note.js, read-note.js, index.html, and README.md with correct placeholders.
