# Paste Locker Template

Secure pastebin with server-side password hashing via run402 functions.

## Customization Points

- `{{APP_NAME}}` — App title
- `{{API_URL}}` — run402 API URL (https://api.run402.com)
- `{{ANON_KEY}}` — Project anon_key from project creation

## Features

- Create notes with optional password protection
- Burn-after-reading (note self-destructs after one read)
- Configurable expiration (1 hour, 24 hours, 7 days, or never)
- Shareable 8-character codes and URLs
- Server-side bcrypt password hashing via run402 functions
- Mobile-responsive

## Server-Side Functions

This template requires two server-side functions deployed via run402's functions API:

1. **create-note** (`create-note.js`) — Validates input, hashes password with bcrypt, generates code, stores note
2. **read-note** (`read-note.js`) — Looks up note by code, verifies password against bcrypt hash, handles burn-after-read

Deploy functions via:
```
POST /admin/v1/projects/:id/functions
Authorization: Bearer <service_key>
{ "name": "create-note", "code": "<contents of create-note.js>" }
```

## Why Server-Side Functions?

The client never directly accesses the `notes` table. All reads and writes go through server-side functions that have the `service_key`. This is necessary because:

- Password hashes must stay on the server — if exposed to the client, anyone could bypass the password check
- Burn-after-read requires atomic read-then-mark-as-read — a race condition if done client-side

## Schema

See `schema.sql` for table definitions.

## RLS

See `rls.json` — no public RLS policies. All access is through server-side functions.
