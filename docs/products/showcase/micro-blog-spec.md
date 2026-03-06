---
product: micro-blog
type: feature
version: "1.0"
template: templates/utility/micro-blog/
---

# Showcase: Micro Blog

Live demo at **blog.run402.com** — a public micro-blog feed where anyone can post short thoughts and photos.

## Source Template

`templates/utility/micro-blog/` (schema.sql, index.html, rls.json)

The showcase is built FROM this template with demo-specific modifications listed below.

## Functional Requirements

### FR-1: Public Feed

- Displays all posts in reverse-chronological order (newest first).
- Each post shows: author name, post text, optional image, timestamp, and heart count.
- Feed is visible to all visitors without authentication.
- Auto-polls every 5 seconds to show new posts from other visitors.

### FR-2: Auth (Sign Up / Log In)

- Auth bar at top with "Sign Up" and "Log In" buttons.
- Uses run402 auth flow (email + password).
- Logged-in users see a compose form; logged-out users see a prompt to sign in.
- Vanity subdomain emphasis: "Your own blog at yourname.run402.com" messaging.

### FR-3: Compose Post

- Text area with 500-character limit and live character counter.
- **Validation:** Post text is required. Empty submissions are blocked client-side.
- Optional image upload (stored in `posts/` bucket via run402 storage).
- On submit: POST to `/rest/v1/posts` with `{ body, author_name, image_url }`.
- Post appears immediately at top of feed (optimistic insert + re-render).

### FR-4: Image Upload

- "Attach image" button below the text area.
- Accepts JPEG, PNG, GIF, WebP (max 5 MB).
- Uploads to run402 storage bucket `posts/`.
- Image preview shown before posting.
- Image displayed inline in the post card after submission.

### FR-5: Heart / Like

- Each post has a heart icon with a count.
- Clicking the heart increments the `hearts` column via PATCH.
- **No auth required** — anyone can heart a post.
- Heart count updates optimistically in the UI.

### FR-6: Seed Posts (demo-specific)

- 8-10 pre-loaded demo posts from seed.sql with varied fake authors and images:
  1. "First day at the new office!" — by "Maya"
  2. "My sourdough starter is finally alive" — by "Leo"
  3. "Hot take: tabs > spaces" — by "Dev Diana"
  4. "Just saw the most adorable dog" — by "Sam" (with pet photo)
  5. "Today's sunset was unreal" — by "Ava" (with sunset image)
  6. "Coffee > everything" — by "Jordan"
  7. "Tried a new ramen place downtown" — by "Kai" (with food pic)
  8. "Debugging at 2am hits different" — by "Noor"
- Seed posts have `is_seed = true` in the database.
- **UI indicator:** Seed posts show a blue "demo" badge.
- **Protection:** Seed posts have NO delete button. DELETE RLS policy excludes `is_seed = true` rows.

### FR-7: Character Counter

- Live counter below the text area showing "X / 500".
- Counter turns red when fewer than 50 characters remain.
- Submit button is disabled when text exceeds 500 characters.

### FR-8: Task Fade & Time Remaining (demo-specific)

- Non-seed posts show a "time remaining" label (e.g., "45m left", "2m left").
- Non-seed posts visually fade as they approach expiry (opacity decreases from 1.0 to 0.4 over 1 hour).
- Seed posts do not fade and have no time-remaining label.

### FR-9: Demo Notice Banner

- Yellow banner at top: "This is a live demo — sign up to post! User posts fade after 1 hour."

### FR-10: Footer

- "Built with bld402 · Powered by run402" with links.

## Schema

Based on template `schema.sql` with demo-specific additions:

```sql
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  body text NOT NULL CHECK (char_length(body) <= 500),
  author_name text NOT NULL,
  image_url text,
  hearts integer DEFAULT 0,
  user_id uuid,
  is_seed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_user ON posts(user_id);
```

**Differences from template:**
- Added `is_seed boolean DEFAULT false` — marks demo posts

### Auto-cleanup (demo-specific)

```sql
CREATE OR REPLACE FUNCTION cleanup_posts() RETURNS trigger AS $$
BEGIN
  -- Delete non-seed posts older than 1 hour
  DELETE FROM posts WHERE is_seed = false AND created_at < now() - interval '1 hour';
  -- Cap non-seed posts at 20 (delete oldest beyond limit)
  DELETE FROM posts WHERE id IN (
    SELECT id FROM posts
    WHERE is_seed = false
    ORDER BY created_at DESC
    OFFSET 20
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cleanup_posts
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_posts();
```

### Seed Data

```sql
INSERT INTO posts (body, author_name, image_url, hearts, is_seed) VALUES
  ('First day at the new office!', 'Maya', NULL, 12, true),
  ('My sourdough starter is finally alive', 'Leo', NULL, 8, true),
  ('Hot take: tabs > spaces', 'Dev Diana', NULL, 24, true),
  ('Just saw the most adorable dog', 'Sam', 'posts/seed-dog.jpg', 31, true),
  ('Today''s sunset was unreal', 'Ava', 'posts/seed-sunset.jpg', 19, true),
  ('Coffee > everything', 'Jordan', NULL, 15, true),
  ('Tried a new ramen place downtown', 'Kai', 'posts/seed-ramen.jpg', 22, true),
  ('Debugging at 2am hits different', 'Noor', NULL, 17, true);
```

## RLS

Based on template `rls.json` with demo-specific modifications:

- **SELECT:** anon can read all rows
- **INSERT:** authenticated users can insert rows (is_seed defaults to false, so users can't inject seed posts)
- **UPDATE:** anon can update `hearts` column only (for liking)
- **DELETE:** authenticated users can delete their own rows WHERE `is_seed = false` only

The INSERT policy should ensure `is_seed` cannot be set to `true` by the client:
```sql
CREATE POLICY "auth_insert" ON posts FOR INSERT TO authenticated
  WITH CHECK (is_seed = false);
```

## Pinned Demo Modifications

1. **Project pinned** — lease never expires
2. **is_seed column** — protects demo posts from deletion
3. **Cleanup trigger** — 1h expiry + 20-post cap for non-seed posts
4. **Fade effect** — visual time-remaining indicator on non-seed posts
5. **Demo notice banner** — added to HTML
6. **Seed images** — pre-uploaded to `posts/` storage bucket
7. **Auth enabled** — sign up / log in required to compose posts

## Acceptance Criteria

- [ ] Page loads showing 8 seed posts with varied authors
- [ ] Seed posts with images display inline photos
- [ ] Feed is in reverse-chronological order (newest first)
- [ ] Auth bar shows Sign Up / Log In buttons
- [ ] Logged-in user sees compose form
- [ ] Can compose a post with text up to 500 chars
- [ ] Empty post submission is blocked
- [ ] Character counter shows live count and turns red below 50 remaining
- [ ] Can attach and upload an image with a post
- [ ] Heart button increments count without auth
- [ ] Seed posts show "demo" badge
- [ ] Seed posts have no delete button
- [ ] Non-seed posts show time remaining ("45m left")
- [ ] Non-seed posts visually fade over 1 hour
- [ ] Polling updates feed every 5 seconds
- [ ] Non-seed posts auto-delete after 1 hour (DB trigger)
- [ ] Non-seed posts capped at 20 (DB trigger)
- [ ] Demo notice banner visible at top
- [ ] Footer shows bld402 + run402 links
- [ ] **Viewport fitting:** App fits in one screen without page-level scroll (100dvh, flex layout); feed scrolls within its container
- [ ] **Responsive:** Post cards and compose form stack properly on narrow screens (< 600px)
- [ ] Page accessible at blog.run402.com
- [ ] **Repeatability:** A fresh project built from `templates/utility/micro-blog/` produces a working micro-blog app

## Template Repeatability

**The key value of each showcase app is proving that the template works.** Anyone following the bld402 steps with this template MUST be able to reach the same functional result. The only differences between a fresh build and the showcase are the pinned demo modifications listed above.

**Red Team must validate both:**
1. **The live demo** at blog.run402.com — test all acceptance criteria above.
2. **A fresh build from scratch** — follow bld402.com steps using `templates/utility/micro-blog/`, provision a new project, deploy, and verify the template produces a working app with the same core functionality (public feed, auth, compose posts, image upload, hearts).
