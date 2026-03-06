---
product: ai-sticker-maker
type: feature
version: "1.0"
template: templates/games/ai-sticker-maker/
---

# Showcase: AI Sticker Maker

Live demo at **stickers.run402.com** — generate custom AI stickers for $0.01 each via x402.

## Source Template

`templates/games/ai-sticker-maker/` (schema.sql, index.html, rls.json)

The showcase is built FROM this template with demo-specific modifications listed below.

## Functional Requirements

### FR-1: Sticker Gallery

- Displays all generated stickers in a responsive grid.
- Each sticker shows: the generated image, the prompt used, and creation timestamp.
- Gallery is in reverse-chronological order (newest first).
- Auto-polls every 5 seconds to show stickers from other visitors.

### FR-2: Generate Sticker

- Text input for a sticker prompt (e.g., "penguin DJ at a beach party").
- **Validation:** Prompt is required. Max 200 characters. Empty submissions are blocked client-side.
- "Generate" button triggers image generation.
- Generation uses the `generate-image-proxy` Lambda function.
- **Cost:** Each generation costs $0.01 paid via x402 crypto micropayment.
- Loading spinner shown while image is being generated.
- Generated sticker appears at top of gallery on completion.

### FR-3: x402 Payment

- Each sticker generation requires a $0.01 x402 micropayment.
- Payment is handled transparently via the x402 protocol.
- If payment fails, the user sees a clear error message.
- No account or wallet setup required — x402 handles the payment flow.

### FR-4: Download Sticker

- Each sticker has a download button.
- Clicking downloads the sticker image as a PNG file.
- Download is available for all stickers (seed and user-generated).

### FR-5: No Auth

- No authentication required — fully public.
- Anyone can generate stickers and browse the gallery.
- Uses `public_read_write` RLS policy.

### FR-6: Seed Stickers (demo-specific)

- 15-20 pre-generated stickers with fun prompts:
  1. "rocket ship made of pizza"
  2. "penguin DJ at a beach party"
  3. "robot dog playing guitar"
  4. "unicorn astronaut"
  5. "grumpy cloud with sunglasses"
  6. "cat wearing a top hat"
  7. "dinosaur riding a skateboard"
  8. "panda eating tacos"
  9. "owl professor with glasses"
  10. "fox in a spacesuit"
  11. "snail racing car"
  12. "hedgehog with headphones"
  13. "llama in a tuxedo"
  14. "octopus juggling"
  15. "bear with a paintbrush"
- Seed stickers have `is_seed = true` in the database.
- **UI indicator:** Seed stickers show a blue "demo" badge.
- **Protection:** Seed stickers have NO delete button. DELETE RLS policy excludes `is_seed = true` rows.

### FR-7: Sticker Fade & Time Remaining (demo-specific)

- Non-seed stickers show a "time remaining" label (e.g., "45m left", "2m left").
- Non-seed stickers visually fade as they approach expiry (opacity decreases from 1.0 to 0.4 over 1 hour).
- Seed stickers do not fade and have no time-remaining label.

### FR-8: Demo Notice Banner

- Yellow banner at top: "This is a live demo — generate your own stickers! Each costs $0.01 in crypto."

### FR-9: Footer

- "Built with bld402 · Powered by run402" with links.

## Schema

Based on template `schema.sql` with demo-specific additions:

```sql
CREATE TABLE stickers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt text NOT NULL CHECK (char_length(prompt) <= 200),
  image_url text NOT NULL,
  user_id uuid,
  is_seed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_stickers_created ON stickers(created_at DESC);
```

**Differences from template:**
- Added `is_seed boolean DEFAULT false` — marks demo stickers

### Auto-cleanup (demo-specific)

```sql
CREATE OR REPLACE FUNCTION cleanup_stickers() RETURNS trigger AS $$
BEGIN
  -- Delete non-seed stickers older than 1 hour
  DELETE FROM stickers WHERE is_seed = false AND created_at < now() - interval '1 hour';
  -- Cap non-seed stickers at 30 (delete oldest beyond limit)
  DELETE FROM stickers WHERE id IN (
    SELECT id FROM stickers
    WHERE is_seed = false
    ORDER BY created_at DESC
    OFFSET 30
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cleanup_stickers
  AFTER INSERT ON stickers
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_stickers();
```

### Seed Data

```sql
INSERT INTO stickers (prompt, image_url, is_seed) VALUES
  ('rocket ship made of pizza', 'stickers/seed-01.png', true),
  ('penguin DJ at a beach party', 'stickers/seed-02.png', true),
  ('robot dog playing guitar', 'stickers/seed-03.png', true),
  ('unicorn astronaut', 'stickers/seed-04.png', true),
  ('grumpy cloud with sunglasses', 'stickers/seed-05.png', true),
  ('cat wearing a top hat', 'stickers/seed-06.png', true),
  ('dinosaur riding a skateboard', 'stickers/seed-07.png', true),
  ('panda eating tacos', 'stickers/seed-08.png', true),
  ('owl professor with glasses', 'stickers/seed-09.png', true),
  ('fox in a spacesuit', 'stickers/seed-10.png', true),
  ('snail racing car', 'stickers/seed-11.png', true),
  ('hedgehog with headphones', 'stickers/seed-12.png', true),
  ('llama in a tuxedo', 'stickers/seed-13.png', true),
  ('octopus juggling', 'stickers/seed-14.png', true),
  ('bear with a paintbrush', 'stickers/seed-15.png', true);
```

## RLS

Based on template `rls.json` (`public_read_write`) with one modification:

- **SELECT:** anon can read all rows
- **INSERT:** anon can insert rows (is_seed defaults to false, so users can't inject seed stickers)
- **UPDATE:** anon can update all rows
- **DELETE:** anon can delete rows WHERE `is_seed = false` only

The INSERT policy should ensure `is_seed` cannot be set to `true` by the client:
```sql
CREATE POLICY "anon_insert" ON stickers FOR INSERT TO anon
  WITH CHECK (is_seed = false);
```

## Pinned Demo Modifications

1. **Project pinned** — lease never expires
2. **is_seed column** — protects demo stickers from deletion
3. **Cleanup trigger** — 1h expiry + 30-sticker cap for non-seed stickers
4. **Fade effect** — visual time-remaining indicator on non-seed stickers
5. **Demo notice banner** — added to HTML
6. **Seed images** — 15 pre-generated sticker PNGs uploaded to `stickers/` storage bucket
7. **Fully functional** — live generation via generate-image-proxy Lambda + x402 payment

## Acceptance Criteria

- [ ] Page loads showing 15 seed stickers in a gallery grid
- [ ] Seed stickers display their prompts and images
- [ ] Gallery is in reverse-chronological order (newest first)
- [ ] Can enter a prompt up to 200 chars
- [ ] Empty prompt submission is blocked
- [ ] "Generate" button triggers image generation via Lambda proxy
- [ ] x402 micropayment of $0.01 is processed per generation
- [ ] Loading spinner shown during generation
- [ ] Generated sticker appears in gallery on completion
- [ ] Download button saves sticker as PNG
- [ ] Seed stickers show "demo" badge
- [ ] Seed stickers have no delete button
- [ ] Non-seed stickers show time remaining ("45m left")
- [ ] Non-seed stickers visually fade over 1 hour
- [ ] Polling updates gallery every 5 seconds
- [ ] Non-seed stickers auto-delete after 1 hour (DB trigger)
- [ ] Non-seed stickers capped at 30 (DB trigger)
- [ ] No auth required — fully public
- [ ] Demo notice banner visible at top
- [ ] Footer shows bld402 + run402 links
- [ ] **Viewport fitting:** App fits in one screen without page-level scroll (100dvh, flex layout); gallery scrolls within its container
- [ ] **Responsive:** Gallery grid and generate form adapt to narrow screens (< 600px)
- [ ] Page accessible at stickers.run402.com
- [ ] **Repeatability:** A fresh project built from `templates/games/ai-sticker-maker/` produces a working sticker maker app

## Template Repeatability

**The key value of each showcase app is proving that the template works.** Anyone following the bld402 steps with this template MUST be able to reach the same functional result. The only differences between a fresh build and the showcase are the pinned demo modifications listed above.

**Red Team must validate both:**
1. **The live demo** at stickers.run402.com — test all acceptance criteria above.
2. **A fresh build from scratch** — follow bld402.com steps using `templates/games/ai-sticker-maker/`, provision a new project, deploy, and verify the template produces a working app with the same core functionality (generate stickers via prompt, x402 payment, gallery display, download).
