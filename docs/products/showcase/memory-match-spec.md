---
product: memory-match
type: feature
version: "1.0"
template: templates/games/memory-match/
---

# Showcase: Memory Match

Live demo at **memory.run402.com** — flip cards and find matching pairs with AI-generated art.

## Source Template

`templates/games/memory-match/` (schema.sql, index.html, rls.json)

The showcase is built FROM this template with demo-specific modifications listed below.

## Functional Requirements

### FR-1: Difficulty Selection

- Landing page shows 3 difficulty options: **Easy** (6 pairs), **Medium** (8 pairs), **Hard** (10 pairs).
- Each option shows the card set name, pair count, and a preview thumbnail.
- Selecting a difficulty starts a new game with that card set.

### FR-2: Game Board

- Cards laid out in a grid face-down.
  - Easy (6 pairs = 12 cards): 3x4 grid.
  - Medium (8 pairs = 16 cards): 4x4 grid.
  - Hard (10 pairs = 20 cards): 4x5 grid.
- Each pair has matching AI-generated art on the face.
- Card backs have a uniform pattern/color.
- Cards are shuffled randomly on each new game.

### FR-3: Card Flip Mechanic

- Clicking a face-down card flips it face-up with a CSS 3D transform animation (0.3s).
- Player can flip at most 2 cards at a time.
- **Match:** If the 2 flipped cards are the same pair, they stay face-up with a brief glow animation.
- **No match:** After 1 second delay, both cards flip back face-down.
- Clicking an already face-up or matched card does nothing.

### FR-4: Move & Time Tracking

- Move counter increments each time 2 cards are flipped (one comparison = one move).
- Timer starts on first card flip and stops when all pairs are matched.
- Both are displayed prominently during gameplay.

### FR-5: Win State

- When all pairs are matched, a congratulations overlay appears.
- Overlay shows: total moves, total time, star rating (3 stars = optimal, 2 = good, 1 = over par).
- Star thresholds per difficulty:
  - Easy: 3 stars <= 8 moves, 2 stars <= 12, 1 star > 12.
  - Medium: 3 stars <= 12 moves, 2 stars <= 18, 1 star > 18.
  - Hard: 3 stars <= 16 moves, 2 stars <= 25, 1 star > 25.
- Player enters their name (max 20 chars) and submits score to leaderboard.
- "Play Again" button resets the board with the same difficulty.

### FR-6: Leaderboard

- Leaderboard page shows top 20 scores per difficulty, sorted by fewest moves (ties broken by fastest time).
- Each entry: rank, player name, moves, time, date.
- Current game's score is highlighted if it appears on the leaderboard.
- Tabs or buttons to switch between Easy/Medium/Hard leaderboards.

### FR-7: Card Sets with AI Art (demo-specific)

- 3 pre-generated card sets stored in `memory-match/` storage bucket:
  1. **Easy — "Animals"** (6 pairs): "happy otter", "sleepy fox", "dancing penguin", "curious owl", "playful kitten", "brave puppy".
  2. **Medium — "Space"** (8 pairs): "ringed planet", "spiral galaxy", "astronaut cat", "rocket ship", "shooting star", "moon crater", "alien plant", "space station".
  3. **Hard — "Ocean"** (10 pairs): "coral reef", "deep sea fish", "sea turtle", "jellyfish", "octopus", "seahorse", "whale shark", "manta ray", "clownfish", "starfish".
- Images are generated during build using AI image generation (prompts stored in `card_images.prompt`).
- Each image stored at `memory-match/{card_set_name}/{pair_index}.png`.

### FR-8: Seed Leaderboard Scores (demo-specific)

- 10 fake scores per difficulty (30 total) pre-loaded to make the leaderboard feel active.
- Easy scores (moves 8-18, times 15-45s): MemoryMaster/8/15s, QuickFlip/9/18s, CardShark/10/22s, BrainTeaser/11/25s, FlipWiz/12/28s, PairPro/13/30s, MatchKing/14/33s, SharpEye/15/36s, FastHands/16/40s, LuckyGuess/18/45s.
- Medium scores (moves 14-30, times 30-90s): MemoryMaster/14/30s, CardShark/16/38s, QuickFlip/18/42s, BrainTeaser/20/50s, FlipWiz/22/55s, PairPro/24/62s, MatchKing/25/68s, SharpEye/26/72s, FastHands/28/80s, LuckyGuess/30/90s.
- Hard scores (moves 20-50, times 45-180s): MemoryMaster/20/45s, QuickFlip/24/58s, CardShark/28/70s, BrainTeaser/32/85s, FlipWiz/35/95s, PairPro/38/110s, MatchKing/40/125s, SharpEye/42/140s, FastHands/46/160s, LuckyGuess/50/180s.

### FR-9: Auto-Polling

- Leaderboard page re-fetches every 10 seconds to show new scores from other players.

### FR-10: Demo Notice Banner

- Yellow banner at top: "This is a live demo — play and submit your score!"

### FR-11: Footer

- "Built with bld402 · Powered by run402" with links.

## Schema

Based on template `schema.sql` with demo-specific additions:

```sql
CREATE TABLE card_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE card_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_set_id uuid REFERENCES card_sets(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  image_path text NOT NULL,
  pair_index integer NOT NULL
);

CREATE TABLE scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL CHECK (char_length(player_name) <= 20),
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  moves integer NOT NULL,
  time_seconds integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_card_images_set ON card_images(card_set_id);
CREATE INDEX idx_scores_difficulty ON scores(difficulty, moves, time_seconds);
```

**Differences from template:**
- Added `CHECK` constraints on difficulty, player_name
- No `is_seed` needed — scores accumulate naturally and no cleanup is required

### Seed Data

```sql
-- Card sets
INSERT INTO card_sets (id, name, difficulty) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'Animals', 'easy'),
  ('c0000001-0000-0000-0000-000000000002', 'Space', 'medium'),
  ('c0000001-0000-0000-0000-000000000003', 'Ocean', 'hard');

-- Animals card images (6 pairs)
INSERT INTO card_images (card_set_id, prompt, image_path, pair_index) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'happy otter', 'memory-match/animals/0.png', 0),
  ('c0000001-0000-0000-0000-000000000001', 'sleepy fox', 'memory-match/animals/1.png', 1),
  ('c0000001-0000-0000-0000-000000000001', 'dancing penguin', 'memory-match/animals/2.png', 2),
  ('c0000001-0000-0000-0000-000000000001', 'curious owl', 'memory-match/animals/3.png', 3),
  ('c0000001-0000-0000-0000-000000000001', 'playful kitten', 'memory-match/animals/4.png', 4),
  ('c0000001-0000-0000-0000-000000000001', 'brave puppy', 'memory-match/animals/5.png', 5);

-- Space card images (8 pairs)
INSERT INTO card_images (card_set_id, prompt, image_path, pair_index) VALUES
  ('c0000001-0000-0000-0000-000000000002', 'ringed planet', 'memory-match/space/0.png', 0),
  ('c0000001-0000-0000-0000-000000000002', 'spiral galaxy', 'memory-match/space/1.png', 1),
  ('c0000001-0000-0000-0000-000000000002', 'astronaut cat', 'memory-match/space/2.png', 2),
  ('c0000001-0000-0000-0000-000000000002', 'rocket ship', 'memory-match/space/3.png', 3),
  ('c0000001-0000-0000-0000-000000000002', 'shooting star', 'memory-match/space/4.png', 4),
  ('c0000001-0000-0000-0000-000000000002', 'moon crater', 'memory-match/space/5.png', 5),
  ('c0000001-0000-0000-0000-000000000002', 'alien plant', 'memory-match/space/6.png', 6),
  ('c0000001-0000-0000-0000-000000000002', 'space station', 'memory-match/space/7.png', 7);

-- Ocean card images (10 pairs)
INSERT INTO card_images (card_set_id, prompt, image_path, pair_index) VALUES
  ('c0000001-0000-0000-0000-000000000003', 'coral reef', 'memory-match/ocean/0.png', 0),
  ('c0000001-0000-0000-0000-000000000003', 'deep sea fish', 'memory-match/ocean/1.png', 1),
  ('c0000001-0000-0000-0000-000000000003', 'sea turtle', 'memory-match/ocean/2.png', 2),
  ('c0000001-0000-0000-0000-000000000003', 'jellyfish', 'memory-match/ocean/3.png', 3),
  ('c0000001-0000-0000-0000-000000000003', 'octopus', 'memory-match/ocean/4.png', 4),
  ('c0000001-0000-0000-0000-000000000003', 'seahorse', 'memory-match/ocean/5.png', 5),
  ('c0000001-0000-0000-0000-000000000003', 'whale shark', 'memory-match/ocean/6.png', 6),
  ('c0000001-0000-0000-0000-000000000003', 'manta ray', 'memory-match/ocean/7.png', 7),
  ('c0000001-0000-0000-0000-000000000003', 'clownfish', 'memory-match/ocean/8.png', 8),
  ('c0000001-0000-0000-0000-000000000003', 'starfish', 'memory-match/ocean/9.png', 9);

-- Seed leaderboard scores: Easy (10 scores)
INSERT INTO scores (player_name, difficulty, moves, time_seconds) VALUES
  ('MemoryMaster', 'easy', 8, 15),
  ('QuickFlip', 'easy', 9, 18),
  ('CardShark', 'easy', 10, 22),
  ('BrainTeaser', 'easy', 11, 25),
  ('FlipWiz', 'easy', 12, 28),
  ('PairPro', 'easy', 13, 30),
  ('MatchKing', 'easy', 14, 33),
  ('SharpEye', 'easy', 15, 36),
  ('FastHands', 'easy', 16, 40),
  ('LuckyGuess', 'easy', 18, 45);

-- Seed leaderboard scores: Medium (10 scores)
INSERT INTO scores (player_name, difficulty, moves, time_seconds) VALUES
  ('MemoryMaster', 'medium', 14, 30),
  ('CardShark', 'medium', 16, 38),
  ('QuickFlip', 'medium', 18, 42),
  ('BrainTeaser', 'medium', 20, 50),
  ('FlipWiz', 'medium', 22, 55),
  ('PairPro', 'medium', 24, 62),
  ('MatchKing', 'medium', 25, 68),
  ('SharpEye', 'medium', 26, 72),
  ('FastHands', 'medium', 28, 80),
  ('LuckyGuess', 'medium', 30, 90);

-- Seed leaderboard scores: Hard (10 scores)
INSERT INTO scores (player_name, difficulty, moves, time_seconds) VALUES
  ('MemoryMaster', 'hard', 20, 45),
  ('QuickFlip', 'hard', 24, 58),
  ('CardShark', 'hard', 28, 70),
  ('BrainTeaser', 'hard', 32, 85),
  ('FlipWiz', 'hard', 35, 95),
  ('PairPro', 'hard', 38, 110),
  ('MatchKing', 'hard', 40, 125),
  ('SharpEye', 'hard', 42, 140),
  ('FastHands', 'hard', 46, 160),
  ('LuckyGuess', 'hard', 50, 180);
```

## RLS

Based on template `rls.json` (`public_read_write`) with minimal modifications:

- **SELECT (card_sets, card_images):** anon can read all rows
- **SELECT (scores):** anon can read all rows
- **INSERT (scores):** anon can insert rows (anyone can submit a score)
- **UPDATE/DELETE (card_sets, card_images):** no public access (admin-only, managed at deploy time)
- **UPDATE/DELETE (scores):** no public access (scores are permanent)

No `is_seed` protection needed on scores since they accumulate naturally and are never deleted.

## Pinned Demo Modifications

1. **Project pinned** — lease never expires
2. **3 AI-generated card sets** — Animals (easy), Space (medium), Ocean (hard) with images in storage
3. **30 seed leaderboard scores** — 10 per difficulty with varying skill levels
4. **Demo notice banner** — added to HTML
5. **Storage bucket** — `memory-match/` contains pre-generated card art
6. **No cleanup needed** — scores accumulate, card sets are static

## Acceptance Criteria

- [ ] Landing page shows 3 difficulty options (Easy/Medium/Hard) with card set names
- [ ] Easy game loads a 3x4 grid (6 pairs, 12 cards)
- [ ] Medium game loads a 4x4 grid (8 pairs, 16 cards)
- [ ] Hard game loads a 4x5 grid (10 pairs, 20 cards)
- [ ] Cards display AI-generated art when flipped
- [ ] Card flip animation uses CSS 3D transform (0.3s)
- [ ] Only 2 cards can be flipped at a time
- [ ] Matching pairs stay face-up with glow animation
- [ ] Non-matching pairs flip back after 1 second
- [ ] Move counter increments on each pair comparison
- [ ] Timer starts on first flip and stops when all pairs matched
- [ ] Win overlay shows moves, time, and star rating
- [ ] Star thresholds are correct per difficulty
- [ ] Player can enter name (max 20 chars) and submit score
- [ ] Leaderboard shows top 20 scores per difficulty
- [ ] Leaderboard sorted by moves (ties broken by time)
- [ ] Seed scores appear on leaderboard (10 per difficulty)
- [ ] "Play Again" button resets board with same difficulty
- [ ] Leaderboard polls every 10 seconds
- [ ] Demo notice banner visible at top
- [ ] Footer shows bld402 + run402 links
- [ ] **Viewport fitting:** App fits in one screen without page-level scroll (100dvh, flex layout); card grid fits within viewport
- [ ] **Responsive:** Grid scales down on narrow screens (< 600px)
- [ ] Page accessible at memory.run402.com
- [ ] **Repeatability:** A fresh project built from `templates/games/memory-match/` produces a working memory match app

## Template Repeatability

**The key value of each showcase app is proving that the template works.** Anyone following the bld402 steps with this template MUST be able to reach the same functional result. The only differences between a fresh build and the showcase are the pinned demo modifications listed above.

**Red Team must validate both:**
1. **The live demo** at memory.run402.com — test all acceptance criteria above.
2. **A fresh build from scratch** — follow bld402.com steps using `templates/games/memory-match/`, provision a new project, deploy, and verify the template produces a working app with the same core functionality (select difficulty, flip cards, match pairs, track moves/time, submit scores to leaderboard).
