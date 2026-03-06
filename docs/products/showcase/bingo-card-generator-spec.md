---
product: bingo-card-generator
type: feature
version: "1.0"
template: templates/games/bingo-card-generator/
---

# Showcase: Bingo Card Generator

Live demo at **bingo.run402.com** — host a custom bingo game with shareable cards.

## Source Template

`templates/games/bingo-card-generator/` (schema.sql, index.html, rls.json)

The showcase is built FROM this template with demo-specific modifications listed below.

## Functional Requirements

### FR-1: Create Game

- Landing page has a "Host New Game" button.
- Game creation form: game name (required, max 100 chars), host name (required, max 50 chars).
- On submit: creates a game row with `status = 'setup'` and a random 6-character alphanumeric `code`.
- Host is redirected to the setup page to add items.

### FR-2: Add Bingo Items

- Setup page shows a textarea for entering items (one per line).
- 3 preset item lists available as quick-fill buttons: "Office Bingo", "Holiday Bingo", "Road Trip Bingo".
- Clicking a preset populates the textarea with that list.
- **Validation:** Minimum 24 items required (to fill a 5x5 grid minus FREE center). Max 75 items.
- "Start Game" button changes status to `playing` and saves all items.

### FR-3: Preset Item Lists

- **Office Bingo** (30 items): "Someone's on mute", "Dog in background", "Sorry I was on mute", "Can you see my screen?", "Let's take this offline", "Quick question", "You're on mute", "Sorry, go ahead", "I'll follow up on that", "Let's circle back", "Synergy", "Deep dive", "Low-hanging fruit", "Move the needle", "Action items", "Bandwidth", "Touch base", "Ping me", "Loop someone in", "EOD", "Per my last email", "Going forward", "Pivot", "Drill down", "Hard stop", "Unpack that", "On my radar", "Table this", "Double-click on that", "At the end of the day".
- **Holiday Bingo** (30 items): "Ugly sweater", "Fruitcake", "Someone sings carols", "Eggnog", "Gift wrapping fail", "Re-gifted present", "Family photo", "Burnt cookies", "Too many leftovers", "Snow day", "Holiday movie marathon", "Secret Santa drama", "Matching pajamas", "Hot chocolate", "Elf on the Shelf", "Gingerbread house", "White elephant gift", "Holiday lights display", "Someone falls asleep", "Turkey talk", "Board game argument", "Kids' table", "Awkward family question", "Dessert before dinner", "Holiday playlist", "Paper crown", "Champagne toast", "Mistletoe", "New Year's resolution", "Countdown to midnight".
- **Road Trip Bingo** (30 items): "Gas station stop", "License plate game", "Are we there yet?", "Fast food drive-thru", "Roadkill spotted", "Construction zone", "Someone falls asleep", "Sing-along", "Rest area", "State line crossing", "Big rig truck", "RV or camper", "Police car", "Billboard for injury lawyer", "Cell service lost", "Pothole", "Wind farm", "Bridge crossing", "Wrong turn", "Car with mattress on top", "Bumper sticker reading", "Scenic overlook", "Toll booth", "Someone changes radio", "Backseat argument", "Snack attack", "GPS rerouting", "Car with bike rack", "Speed limit change", "Sunrise or sunset".

### FR-4: Join Game

- Players join via game code (entered on landing page) or direct link.
- Player enters their name (required, max 50 chars).
- On join: server generates a random 5x5 card from the game's items (24 random items + FREE center).
- Card and marked state stored as `jsonb` arrays on the player row.

### FR-5: Play Bingo

- Player sees their 5x5 card grid. Center cell shows "FREE" and is pre-marked.
- Clicking a cell toggles its marked state (PATCH to update `marked` jsonb).
- Marked cells get a visual highlight (colored background).
- "BINGO!" button appears when player believes they have a line.
- Clicking "BINGO!" validates the marked cells for a complete row, column, or diagonal.
- If valid: `has_bingo = true` is set and a celebration animation plays.
- If invalid: brief shake animation and "Not yet!" message.

### FR-6: Host Controls

- Host view shows all items with "Call" buttons.
- Calling an item marks it as `called = true` with an incrementing `call_order`.
- Called items are visually distinguished (strikethrough + green background).
- Host can see which players have joined and who has bingo.

### FR-7: 5x5 Grid with FREE Center

- Cards are always 5x5 (25 cells).
- Center cell (row 3, col 3) is always "FREE" and pre-marked.
- Remaining 24 cells are randomly selected from the game's item pool.

### FR-8: Pre-Created Demo Game (demo-specific)

- One pre-created game "Demo Office Bingo" with `status = 'finished'`, `is_seed = true`.
- Uses the Office Bingo preset items, all marked as `called = true` with sequential `call_order`.
- 3 demo players: "Alice" (has_bingo = true), "Bob", "Charlie" — each with a randomized card and realistic marked state.
- Landing page has a "View Demo Game" button linking to the finished game view.
- Demo game shows the completed board state: all items called, Alice's winning line highlighted.

### FR-9: Auto-Polling

- Player view polls every 3 seconds for updated called items.
- Host view polls every 5 seconds for updated player list and bingo status.

### FR-10: Demo Notice Banner

- Yellow banner at top: "This is a demo of a completed game. Host your own with bld402!"

### FR-11: Footer

- "Built with bld402 · Powered by run402" with links.

## Schema

Based on template `schema.sql` with demo-specific additions:

```sql
CREATE TABLE games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) <= 100),
  code text NOT NULL UNIQUE,
  host_name text NOT NULL CHECK (char_length(host_name) <= 50),
  status text NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'playing', 'finished')),
  is_seed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  label text NOT NULL,
  called boolean DEFAULT false,
  call_order integer
);

CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) <= 50),
  card jsonb,
  marked jsonb,
  has_bingo boolean DEFAULT false,
  joined_at timestamptz DEFAULT now()
);

CREATE INDEX idx_games_code ON games(code);
CREATE INDEX idx_items_game ON items(game_id);
CREATE INDEX idx_players_game ON players(game_id);
```

**Differences from template:**
- Added `is_seed boolean DEFAULT false` on `games` — marks the demo game
- Added `CHECK` constraints on name, host_name, player name, status

### Auto-cleanup (demo-specific)

```sql
CREATE OR REPLACE FUNCTION cleanup_bingo_games() RETURNS trigger AS $$
BEGIN
  -- Delete non-seed games older than 1 hour (cascades to items and players)
  DELETE FROM games WHERE is_seed = false AND created_at < now() - interval '1 hour';
  -- Cap non-seed games at 5 (delete oldest beyond limit)
  DELETE FROM games WHERE id IN (
    SELECT id FROM games
    WHERE is_seed = false
    ORDER BY created_at DESC
    OFFSET 5
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cleanup_bingo
  AFTER INSERT ON games
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_bingo_games();
```

### Seed Data

```sql
-- Demo game: Office Bingo (finished state)
INSERT INTO games (id, name, code, host_name, status, is_seed) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'Demo Office Bingo', 'DEMO01', 'DemoHost', 'finished', true);

-- All 30 Office Bingo items, all called
INSERT INTO items (game_id, label, called, call_order) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'Someone''s on mute', true, 1),
  ('b0000001-0000-0000-0000-000000000001', 'Dog in background', true, 2),
  ('b0000001-0000-0000-0000-000000000001', 'Sorry I was on mute', true, 3),
  ('b0000001-0000-0000-0000-000000000001', 'Can you see my screen?', true, 4),
  ('b0000001-0000-0000-0000-000000000001', 'Let''s take this offline', true, 5),
  ('b0000001-0000-0000-0000-000000000001', 'Quick question', true, 6),
  ('b0000001-0000-0000-0000-000000000001', 'You''re on mute', true, 7),
  ('b0000001-0000-0000-0000-000000000001', 'Sorry, go ahead', true, 8),
  ('b0000001-0000-0000-0000-000000000001', 'I''ll follow up on that', true, 9),
  ('b0000001-0000-0000-0000-000000000001', 'Let''s circle back', true, 10),
  ('b0000001-0000-0000-0000-000000000001', 'Synergy', true, 11),
  ('b0000001-0000-0000-0000-000000000001', 'Deep dive', true, 12),
  ('b0000001-0000-0000-0000-000000000001', 'Low-hanging fruit', true, 13),
  ('b0000001-0000-0000-0000-000000000001', 'Move the needle', true, 14),
  ('b0000001-0000-0000-0000-000000000001', 'Action items', true, 15),
  ('b0000001-0000-0000-0000-000000000001', 'Bandwidth', true, 16),
  ('b0000001-0000-0000-0000-000000000001', 'Touch base', true, 17),
  ('b0000001-0000-0000-0000-000000000001', 'Ping me', true, 18),
  ('b0000001-0000-0000-0000-000000000001', 'Loop someone in', true, 19),
  ('b0000001-0000-0000-0000-000000000001', 'EOD', true, 20),
  ('b0000001-0000-0000-0000-000000000001', 'Per my last email', true, 21),
  ('b0000001-0000-0000-0000-000000000001', 'Going forward', true, 22),
  ('b0000001-0000-0000-0000-000000000001', 'Pivot', true, 23),
  ('b0000001-0000-0000-0000-000000000001', 'Drill down', true, 24),
  ('b0000001-0000-0000-0000-000000000001', 'Hard stop', true, 25),
  ('b0000001-0000-0000-0000-000000000001', 'Unpack that', true, 26),
  ('b0000001-0000-0000-0000-000000000001', 'On my radar', true, 27),
  ('b0000001-0000-0000-0000-000000000001', 'Table this', true, 28),
  ('b0000001-0000-0000-0000-000000000001', 'Double-click on that', true, 29),
  ('b0000001-0000-0000-0000-000000000001', 'At the end of the day', true, 30);

-- 3 demo players with randomized cards
INSERT INTO players (game_id, name, card, marked, has_bingo) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'Alice',
    '["Someone''s on mute","Deep dive","Synergy","Quick question","Pivot","Dog in background","Low-hanging fruit","Bandwidth","Ping me","EOD","Let''s circle back","Action items","FREE","Touch base","Going forward","Hard stop","Move the needle","Sorry I was on mute","Loop someone in","Can you see my screen?","Per my last email","Drill down","You''re on mute","Let''s take this offline","Table this"]',
    '[true,true,true,true,true,false,true,false,true,false,true,true,true,true,true,false,true,false,true,false,true,true,true,false,true]',
    true),
  ('b0000001-0000-0000-0000-000000000001', 'Bob',
    '["Bandwidth","Sorry, go ahead","Pivot","You''re on mute","Hard stop","Action items","Let''s circle back","Dog in background","EOD","Synergy","Per my last email","Drill down","FREE","Quick question","Move the needle","Someone''s on mute","Touch base","Loop someone in","Going forward","Deep dive","Can you see my screen?","Ping me","Low-hanging fruit","Table this","Let''s take this offline"]',
    '[true,false,true,true,false,true,false,true,true,false,true,false,true,true,false,true,false,true,false,true,false,true,false,true,false]',
    false),
  ('b0000001-0000-0000-0000-000000000001', 'Charlie',
    '["Let''s take this offline","Synergy","EOD","Touch base","Per my last email","Drill down","Quick question","Move the needle","Action items","Dog in background","Pivot","Sorry I was on mute","FREE","Hard stop","Bandwidth","Going forward","Loop someone in","Deep dive","Someone''s on mute","Low-hanging fruit","Can you see my screen?","You''re on mute","Ping me","Let''s circle back","Sorry, go ahead"]',
    '[false,true,true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false,false,true,false,true,false]',
    false);
```

## RLS

Based on template `rls.json` (`public_read_write`) with one modification:

- **SELECT (games, items, players):** anon can read all rows
- **INSERT (games):** anon can insert rows (`is_seed` defaults to false)
- **INSERT (items):** anon can insert rows for games they created
- **INSERT (players):** anon can insert rows (join any game)
- **UPDATE (items):** anon can update rows (for calling items)
- **UPDATE (players):** anon can update rows (for marking cells, claiming bingo)
- **UPDATE (games):** anon can update rows WHERE `is_seed = false` (for status changes)
- **DELETE (games):** anon can delete rows WHERE `is_seed = false`

The INSERT policy on games ensures `is_seed` cannot be set to `true` by the client:
```sql
CREATE POLICY "anon_insert_games" ON games FOR INSERT TO anon
  WITH CHECK (is_seed = false);
```

## Pinned Demo Modifications

1. **Project pinned** — lease never expires
2. **is_seed column** — protects demo game from deletion
3. **Cleanup trigger** — 1h expiry + 5-game cap for non-seed games
4. **Pre-created finished game** — "Demo Office Bingo" with 3 players showing completed state
5. **"View Demo Game" button** — on landing page linking to the seed game
6. **Demo notice banner** — added to HTML
7. **3 preset item lists** — Office Bingo, Holiday Bingo, Road Trip Bingo (stored in JS)

## Acceptance Criteria

- [ ] Landing page shows "Host New Game" and "View Demo Game" buttons
- [ ] Demo game loads in finished state with all items called
- [ ] Demo game shows 3 players (Alice with bingo, Bob, Charlie)
- [ ] Alice's winning line is visually highlighted
- [ ] Can create a new game with name and host name
- [ ] Setup page allows entering items (one per line)
- [ ] 3 preset buttons populate textarea with item lists
- [ ] Minimum 24 items enforced before starting game
- [ ] Starting game generates a unique 6-character code
- [ ] Players can join via code entry or direct link
- [ ] Player cards are 5x5 with FREE center, 24 random items from pool
- [ ] Clicking cells toggles marked state
- [ ] "BINGO!" button validates rows, columns, and diagonals
- [ ] Valid bingo triggers celebration animation
- [ ] Invalid bingo shows shake animation and "Not yet!" message
- [ ] Host can call items with sequential ordering
- [ ] Player view polls every 3 seconds for called items
- [ ] Seed game cannot be deleted or modified
- [ ] Non-seed games auto-delete after 1 hour (DB trigger)
- [ ] Non-seed games capped at 5 (DB trigger)
- [ ] Demo notice banner visible at top
- [ ] Footer shows bld402 + run402 links
- [ ] **Viewport fitting:** App fits in one screen without page-level scroll (100dvh, flex layout); 5x5 grid fits within viewport
- [ ] **Responsive:** Grid scales down on narrow screens (< 600px)
- [ ] Page accessible at bingo.run402.com
- [ ] **Repeatability:** A fresh project built from `templates/games/bingo-card-generator/` produces a working bingo app

## Template Repeatability

**The key value of each showcase app is proving that the template works.** Anyone following the bld402 steps with this template MUST be able to reach the same functional result. The only differences between a fresh build and the showcase are the pinned demo modifications listed above.

**Red Team must validate both:**
1. **The live demo** at bingo.run402.com — test all acceptance criteria above.
2. **A fresh build from scratch** — follow bld402.com steps using `templates/games/bingo-card-generator/`, provision a new project, deploy, and verify the template produces a working app with the same core functionality (create game, add items, join as player, mark cells, call bingo).
