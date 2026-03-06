---
product: flash-cards
type: feature
version: "1.0"
template: templates/utility/flash-cards/
---

# Showcase: Flash Cards

Live demo at **cards.run402.com** — create and study flash card decks with spaced repetition.

## Source Template

`templates/utility/flash-cards/` (schema.sql, index.html, rls.json)

The showcase is built FROM this template with demo-specific modifications listed below.

## Functional Requirements

### FR-1: Authentication

- Sign-up / log-in form (email + password via run402 auth).
- Authenticated users can create, edit, and delete their own decks.
- Unauthenticated visitors can browse public decks and study them read-only (progress is not saved).

### FR-2: Browse Public Decks

- Landing page lists all decks where `is_public = true`.
- Each deck card shows name, description, and card count.
- Clicking a deck opens study mode (FR-4).

### FR-3: Create & Manage Decks

- Authenticated users see a "New Deck" button.
- Deck form: name (required, max 100 chars), description (optional, max 300 chars), is_public toggle.
- After creating a deck, user is taken to the card editor.
- Card editor: list of front/back pairs with add, edit, delete, and drag-to-reorder.
- **Validation:** Front and back text required, max 500 chars each.

### FR-4: Study Mode

- Displays one card at a time, front face visible.
- Clicking the card triggers a flip animation (CSS 3D transform, 0.4s) to reveal the back.
- After flipping, user rates recall: **Again** | **Hard** | **Good** | **Easy**.
- Rating updates the SM-2 spaced repetition fields (`ease_factor`, `interval_days`, `next_review`) for authenticated users.
- Cards due for review (`next_review <= now()`) are shown first; remaining cards fill in after.
- Progress bar shows cards reviewed vs. total in current session.

### FR-5: SM-2 Spaced Repetition

- Algorithm applied per card per user via the `progress` table.
- Default: `ease_factor = 2.5`, `interval_days = 0`, `next_review = now()`.
- **Again:** `interval_days = 0`, `ease_factor = max(1.3, ease_factor - 0.2)`, `next_review = now()`.
- **Hard:** `interval_days = max(1, interval_days * 1.2)`, `ease_factor = max(1.3, ease_factor - 0.15)`.
- **Good:** `interval_days = max(1, interval_days * ease_factor)`, no ease change.
- **Easy:** `interval_days = max(1, interval_days * ease_factor * 1.3)`, `ease_factor += 0.15`.
- `review_count` incremented on every rating.

### FR-6: Clone Public Deck

- Each public deck has a "Clone to My Decks" button (visible to authenticated users).
- Cloning copies the deck and all its cards to the user's account with `is_public = false`.
- Cloned deck name is prefixed with "Copy of ".

### FR-7: Seed Decks (demo-specific)

- 3 pre-loaded public decks owned by a demo user (`is_public = true`, `is_seed = true`):
  1. **"World Capitals"** (20 cards): France/Paris, Japan/Tokyo, Brazil/Brasilia, Australia/Canberra, Egypt/Cairo, Canada/Ottawa, Italy/Rome, India/New Delhi, Mexico/Mexico City, Germany/Berlin, South Korea/Seoul, Argentina/Buenos Aires, Thailand/Bangkok, Kenya/Nairobi, Norway/Oslo, Peru/Lima, Turkey/Ankara, Poland/Warsaw, Vietnam/Hanoi, Morocco/Rabat.
  2. **"Spanish Basics"** (15 cards): Hello/Hola, Goodbye/Adiós, Please/Por favor, Thank you/Gracias, Water/Agua, Food/Comida, House/Casa, Dog/Perro, Cat/Gato, Book/Libro, Friend/Amigo, Good morning/Buenos días, How are you?/¿Cómo estás?, I love you/Te quiero, Cheers/Salud.
  3. **"Web Dev Terms"** (15 cards): REST API/A way for apps to talk over the internet using URLs and HTTP methods, HTML/The language that defines the structure of web pages, CSS/Stylesheet language that controls how web pages look, JavaScript/Programming language that makes web pages interactive, Database/Organized storage for application data, DNS/System that converts domain names to IP addresses, HTTP/Protocol for transferring web pages between servers and browsers, JSON/Lightweight data format using key-value pairs, Git/Version control system that tracks code changes, Docker/Tool that packages apps with their dependencies into containers, SQL/Language for querying and managing databases, CDN/Network of servers that delivers content from locations close to users, OAuth/Standard for letting apps access your data without sharing your password, WebSocket/Two-way communication channel between browser and server, Responsive Design/Approach where layouts adapt to different screen sizes.
- **Protection:** Seed decks and their cards cannot be edited or deleted. DELETE and UPDATE RLS policies exclude `is_seed = true` rows.
- **UI indicator:** Seed decks show a blue "demo" badge.

### FR-8: Auto-Polling

- Deck list re-fetches every 10 seconds to show new public decks from other users.

### FR-9: Demo Notice Banner

- Yellow banner at top: "This is a live demo — sign up to create your own decks! Seed decks are read-only."

### FR-10: Footer

- "Built with bld402 · Powered by run402" with links.

## Schema

Based on template `schema.sql` with demo-specific additions:

```sql
CREATE TABLE decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) <= 100),
  description text CHECK (char_length(description) <= 300),
  user_id uuid,
  is_public boolean DEFAULT false,
  is_seed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid REFERENCES decks(id) ON DELETE CASCADE,
  front text NOT NULL CHECK (char_length(front) <= 500),
  back text NOT NULL CHECK (char_length(back) <= 500),
  sort_order integer DEFAULT 0
);

CREATE TABLE progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid REFERENCES cards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  ease_factor numeric DEFAULT 2.5,
  interval_days numeric DEFAULT 0,
  next_review timestamptz DEFAULT now(),
  review_count integer DEFAULT 0
);

CREATE INDEX idx_decks_user ON decks(user_id);
CREATE INDEX idx_decks_public ON decks(is_public);
CREATE INDEX idx_cards_deck ON cards(deck_id);
CREATE INDEX idx_progress_user_card ON progress(user_id, card_id);
```

**Differences from template:**
- Added `is_seed boolean DEFAULT false` on `decks` — marks demo decks
- Added `CHECK` constraints on name, description, front, back

### Auto-cleanup (demo-specific)

```sql
CREATE OR REPLACE FUNCTION cleanup_flash_cards() RETURNS trigger AS $$
BEGIN
  -- Delete non-seed decks older than 1 hour (cascades to cards)
  DELETE FROM decks WHERE is_seed = false AND created_at < now() - interval '1 hour';
  -- Cap non-seed decks at 10 (delete oldest beyond limit)
  DELETE FROM decks WHERE id IN (
    SELECT id FROM decks
    WHERE is_seed = false
    ORDER BY created_at DESC
    OFFSET 10
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cleanup_decks
  AFTER INSERT ON decks
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_flash_cards();
```

### Seed Data

```sql
-- Demo user for seed decks (created via run402 auth seeding)
-- Seed decks
INSERT INTO decks (id, name, description, user_id, is_public, is_seed) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'World Capitals', 'Match countries to their capital cities', null, true, true),
  ('d0000001-0000-0000-0000-000000000002', 'Spanish Basics', 'Essential Spanish vocabulary for beginners', null, true, true),
  ('d0000001-0000-0000-0000-000000000003', 'Web Dev Terms', 'Key web development concepts explained simply', null, true, true);

-- World Capitals (20 cards)
INSERT INTO cards (deck_id, front, back, sort_order) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'France', 'Paris', 1),
  ('d0000001-0000-0000-0000-000000000001', 'Japan', 'Tokyo', 2),
  ('d0000001-0000-0000-0000-000000000001', 'Brazil', 'Brasilia', 3),
  ('d0000001-0000-0000-0000-000000000001', 'Australia', 'Canberra', 4),
  ('d0000001-0000-0000-0000-000000000001', 'Egypt', 'Cairo', 5),
  ('d0000001-0000-0000-0000-000000000001', 'Canada', 'Ottawa', 6),
  ('d0000001-0000-0000-0000-000000000001', 'Italy', 'Rome', 7),
  ('d0000001-0000-0000-0000-000000000001', 'India', 'New Delhi', 8),
  ('d0000001-0000-0000-0000-000000000001', 'Mexico', 'Mexico City', 9),
  ('d0000001-0000-0000-0000-000000000001', 'Germany', 'Berlin', 10),
  ('d0000001-0000-0000-0000-000000000001', 'South Korea', 'Seoul', 11),
  ('d0000001-0000-0000-0000-000000000001', 'Argentina', 'Buenos Aires', 12),
  ('d0000001-0000-0000-0000-000000000001', 'Thailand', 'Bangkok', 13),
  ('d0000001-0000-0000-0000-000000000001', 'Kenya', 'Nairobi', 14),
  ('d0000001-0000-0000-0000-000000000001', 'Norway', 'Oslo', 15),
  ('d0000001-0000-0000-0000-000000000001', 'Peru', 'Lima', 16),
  ('d0000001-0000-0000-0000-000000000001', 'Turkey', 'Ankara', 17),
  ('d0000001-0000-0000-0000-000000000001', 'Poland', 'Warsaw', 18),
  ('d0000001-0000-0000-0000-000000000001', 'Vietnam', 'Hanoi', 19),
  ('d0000001-0000-0000-0000-000000000001', 'Morocco', 'Rabat', 20);

-- Spanish Basics (15 cards)
INSERT INTO cards (deck_id, front, back, sort_order) VALUES
  ('d0000001-0000-0000-0000-000000000002', 'Hello', 'Hola', 1),
  ('d0000001-0000-0000-0000-000000000002', 'Goodbye', 'Adiós', 2),
  ('d0000001-0000-0000-0000-000000000002', 'Please', 'Por favor', 3),
  ('d0000001-0000-0000-0000-000000000002', 'Thank you', 'Gracias', 4),
  ('d0000001-0000-0000-0000-000000000002', 'Water', 'Agua', 5),
  ('d0000001-0000-0000-0000-000000000002', 'Food', 'Comida', 6),
  ('d0000001-0000-0000-0000-000000000002', 'House', 'Casa', 7),
  ('d0000001-0000-0000-0000-000000000002', 'Dog', 'Perro', 8),
  ('d0000001-0000-0000-0000-000000000002', 'Cat', 'Gato', 9),
  ('d0000001-0000-0000-0000-000000000002', 'Book', 'Libro', 10),
  ('d0000001-0000-0000-0000-000000000002', 'Friend', 'Amigo', 11),
  ('d0000001-0000-0000-0000-000000000002', 'Good morning', 'Buenos días', 12),
  ('d0000001-0000-0000-0000-000000000002', 'How are you?', '¿Cómo estás?', 13),
  ('d0000001-0000-0000-0000-000000000002', 'I love you', 'Te quiero', 14),
  ('d0000001-0000-0000-0000-000000000002', 'Cheers', 'Salud', 15);

-- Web Dev Terms (15 cards)
INSERT INTO cards (deck_id, front, back, sort_order) VALUES
  ('d0000001-0000-0000-0000-000000000003', 'REST API', 'A way for apps to talk over the internet using URLs and HTTP methods', 1),
  ('d0000001-0000-0000-0000-000000000003', 'HTML', 'The language that defines the structure of web pages', 2),
  ('d0000001-0000-0000-0000-000000000003', 'CSS', 'Stylesheet language that controls how web pages look', 3),
  ('d0000001-0000-0000-0000-000000000003', 'JavaScript', 'Programming language that makes web pages interactive', 4),
  ('d0000001-0000-0000-0000-000000000003', 'Database', 'Organized storage for application data', 5),
  ('d0000001-0000-0000-0000-000000000003', 'DNS', 'System that converts domain names to IP addresses', 6),
  ('d0000001-0000-0000-0000-000000000003', 'HTTP', 'Protocol for transferring web pages between servers and browsers', 7),
  ('d0000001-0000-0000-0000-000000000003', 'JSON', 'Lightweight data format using key-value pairs', 8),
  ('d0000001-0000-0000-0000-000000000003', 'Git', 'Version control system that tracks code changes', 9),
  ('d0000001-0000-0000-0000-000000000003', 'Docker', 'Tool that packages apps with their dependencies into containers', 10),
  ('d0000001-0000-0000-0000-000000000003', 'SQL', 'Language for querying and managing databases', 11),
  ('d0000001-0000-0000-0000-000000000003', 'CDN', 'Network of servers that delivers content from locations close to users', 12),
  ('d0000001-0000-0000-0000-000000000003', 'OAuth', 'Standard for letting apps access your data without sharing your password', 13),
  ('d0000001-0000-0000-0000-000000000003', 'WebSocket', 'Two-way communication channel between browser and server', 14),
  ('d0000001-0000-0000-0000-000000000003', 'Responsive Design', 'Approach where layouts adapt to different screen sizes', 15);
```

## RLS

Based on template `rls.json` with demo-specific modifications:

- **SELECT (decks):** anon and authenticated can read all rows where `is_public = true`; authenticated can also read own rows
- **INSERT (decks):** authenticated can insert rows (`is_seed` defaults to false)
- **UPDATE (decks):** authenticated can update own rows WHERE `is_seed = false`
- **DELETE (decks):** authenticated can delete own rows WHERE `is_seed = false`
- **SELECT (cards):** anon and authenticated can read cards belonging to accessible decks
- **INSERT (cards):** authenticated can insert cards into own decks
- **UPDATE/DELETE (cards):** authenticated can modify cards in own non-seed decks
- **SELECT (progress):** authenticated can read own rows
- **INSERT/UPDATE (progress):** authenticated can upsert own rows

The INSERT policy on decks ensures `is_seed` cannot be set to `true` by the client:
```sql
CREATE POLICY "auth_insert_decks" ON decks FOR INSERT TO authenticated
  WITH CHECK (is_seed = false AND auth.uid() = user_id);
```

## Pinned Demo Modifications

1. **Project pinned** — lease never expires
2. **is_seed column** — protects demo decks and their cards from deletion
3. **Cleanup trigger** — 1h expiry + 10-deck cap for non-seed decks
4. **3 seed decks** — World Capitals (20 cards), Spanish Basics (15 cards), Web Dev Terms (15 cards)
5. **Demo notice banner** — added to HTML
6. **Card flip animation** — CSS 3D transform on study cards

## Acceptance Criteria

- [ ] Page loads showing 3 public seed decks (World Capitals, Spanish Basics, Web Dev Terms)
- [ ] Unauthenticated users can browse and study public decks
- [ ] Sign-up and log-in work via run402 auth
- [ ] Authenticated users can create a new deck with name and description
- [ ] Card editor allows adding, editing, deleting, and reordering cards
- [ ] Study mode shows one card at a time with flip animation
- [ ] Flip animation uses CSS 3D transform (0.4s transition)
- [ ] After flipping, recall buttons appear: Again, Hard, Good, Easy
- [ ] SM-2 algorithm updates ease_factor, interval_days, next_review correctly
- [ ] Cards due for review are prioritized in study mode
- [ ] Clone button copies a public deck to authenticated user's account
- [ ] Seed decks show "demo" badge
- [ ] Seed decks cannot be edited or deleted
- [ ] Non-seed decks auto-delete after 1 hour (DB trigger)
- [ ] Non-seed decks capped at 10 (DB trigger)
- [ ] Demo notice banner visible at top
- [ ] Footer shows bld402 + run402 links
- [ ] **Viewport fitting:** App fits in one screen without page-level scroll (100dvh, flex layout); card list scrolls within its container
- [ ] **Responsive:** Layout stacks vertically on narrow screens (< 600px)
- [ ] Page accessible at cards.run402.com
- [ ] **Repeatability:** A fresh project built from `templates/utility/flash-cards/` produces a working flash cards app

## Template Repeatability

**The key value of each showcase app is proving that the template works.** Anyone following the bld402 steps with this template MUST be able to reach the same functional result. The only differences between a fresh build and the showcase are the pinned demo modifications listed above.

**Red Team must validate both:**
1. **The live demo** at cards.run402.com — test all acceptance criteria above.
2. **A fresh build from scratch** — follow bld402.com steps using `templates/utility/flash-cards/`, provision a new project, deploy, and verify the template produces a working app with the same core functionality (create decks, add cards, study with flip animation, spaced repetition tracking).
