---
product: landing-waitlist
type: feature
version: "1.0"
template: templates/utility/landing-waitlist/
---

# Showcase: Landing Page + Waitlist

Live demo at **waitlist.run402.com** — a product launch page with email signup.

## Source Template

`templates/utility/landing-waitlist/` (schema.sql, index.html, rls.json)

The showcase is built FROM this template with demo-specific modifications listed below.

## Product Theme

**Cosmic Coffee Delivery** — a fun, fictional product.

- **Headline:** "Cosmic Coffee Delivery is Coming"
- **Subheadline:** "Fresh-roasted beans delivered from orbit. Be the first to taste the future of coffee."
- **CTA button text:** "Join the Waitlist"
- **Features heading:** "Why You'll Love It"
- **Feature 1:** Icon: rocket, Title: "Orbital Roasting", Desc: "Beans roasted at the edge of space for a zero-gravity flavor profile."
- **Feature 2:** Icon: clock, Title: "30-Minute Delivery", Desc: "From orbit to your doorstep in under 30 minutes. Seriously."
- **Feature 3:** Icon: sparkles, Title: "AI Barista", Desc: "Your personal AI learns your taste and picks the perfect roast every time."

## Functional Requirements

### FR-1: Email Signup

- User enters email in the hero form or bottom CTA form.
- **Client-side validation:** Email format must be validated before submission. Invalid emails show inline error "Please enter a valid email address."
- On submit, a SHA-256 hash of the lowercase-trimmed email is computed client-side.
- The hash is sent to the API (NOT the raw email). The `signups` table stores only the hash.
- On success: the form hides and a success message appears: **"Thank you for registering for this demo!"**
- On duplicate (409 from unique constraint): show **"You're already on the waitlist!"** without hiding the form.
- On error: show "Something went wrong. Please try again."
- Both forms (hero and bottom CTA) behave identically. Submitting either one updates both UI sections.

### FR-2: Waitlist Counter

- On page load, fetch the total number of rows in `signups` and display: **"X people on the waitlist"**
- The counter shows the cumulative total (never resets).
- The counter updates after each successful signup.
- Use PostgREST `Prefer: count=exact` with `HEAD` request (avoids fetching row data).

### FR-3: Demo Notice Banner

- Yellow banner at page top: "This is a live demo built with bld402 — try signing up!"
- Links "bld402" to https://bld402.com

### FR-4: Footer

- "Built with bld402 · Powered by run402" with links to https://bld402.com and https://run402.com

## Schema

Based on template `schema.sql` with one modification — store hash instead of raw email:

```sql
CREATE TABLE signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_signups_hash ON signups(email_hash);
```

**Differences from template:**
- Column renamed from `email` to `email_hash` (stores SHA-256 hex string, not raw email)
- No PII stored in the database

### Auto-cleanup (demo-specific)

```sql
-- Delete hashes older than 24 hours on each insert
-- This prevents unbounded storage growth
-- The counter still reflects cumulative signups (uses a separate counter approach)
CREATE OR REPLACE FUNCTION cleanup_signups() RETURNS trigger AS $$
BEGIN
  DELETE FROM signups WHERE created_at < now() - interval '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cleanup_signups
  AFTER INSERT ON signups
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_signups();
```

**Note:** The counter value comes from counting current rows. After 24h cleanup, the counter may decrease. This is acceptable for the demo — it reflects "active recent signups." If we want a monotonically increasing counter, we'd need a separate counter table (out of scope for v1).

## RLS

Based on template `rls.json`:
- `public_read_write` on `signups` — anon can INSERT and SELECT.
- SELECT is needed for the counter (row count).
- INSERT is needed for signup.

## Pinned Demo Modifications

These are changes made AFTER building from the template, specific to the showcase:

1. **Project pinned** — lease never expires
2. **Hash instead of raw email** — privacy-safe for a public demo
3. **Cleanup trigger** — 24h expiry prevents unbounded growth
4. **Demo notice banner** — added to HTML
5. **Themed content** — Cosmic Coffee Delivery fills the template placeholders

## Template Repeatability

**The key value of each showcase app is proving that the template works.** Anyone following the bld402 steps with this template MUST be able to reach the same functional result. The only differences between a fresh build and the showcase are the pinned demo modifications listed above.

**Red Team must validate both:**
1. **The live demo** at waitlist.run402.com — test all acceptance criteria below.
2. **A fresh build from scratch** — follow bld402.com steps using `templates/utility/landing-waitlist/`, provision a new project, deploy, and verify the template produces a working app with the same core functionality (email signup, duplicate detection, success/error messages).

## Acceptance Criteria

- [ ] Page loads and displays the Cosmic Coffee theme
- [ ] Email input validates format client-side (rejects "foo", accepts "foo@bar.com")
- [ ] Valid email submits successfully and shows "Thank you for registering for this demo!"
- [ ] Same email submitted twice shows "You're already on the waitlist!"
- [ ] Counter displays on load and increments after signup
- [ ] Both signup forms (hero and bottom CTA) work
- [ ] No raw email is stored in the database (only SHA-256 hash)
- [ ] Demo notice banner is visible at top
- [ ] Footer shows bld402 + run402 links
- [ ] **Responsive:** Hero, features, and CTA sections adapt to mobile (< 600px); form stacks vertically
- [ ] Page is accessible at waitlist.run402.com
- [ ] **Repeatability:** A fresh project built from `templates/utility/landing-waitlist/` produces a working waitlist app
