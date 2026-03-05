---
product: trivia-night
type: feature
version: "1.0"
template: templates/games/trivia-night/
---

# Showcase: Trivia Night

Live demo at **trivia.run402.com** — a Kahoot-style multiplayer quiz game.

## Source Template

`templates/games/trivia-night/` (schema.sql, index.html, rls.json)

The showcase is built FROM this template with demo-specific modifications listed below.

## Functional Requirements

### FR-1: Home Screen

- Two main buttons: **"Host a Game"** and **"Join a Game"**
- Below: a **"Try a Demo"** section showing 3 pre-loaded demo rooms as clickable cards:
  - DEMO1 — General Knowledge (10 questions)
  - DEMO2 — Movies & TV (10 questions)
  - DEMO3 — Food & Drink (10 questions)
- Each demo card shows room code, topic, and current player count.
- Clicking a demo card goes to the join flow with the code pre-filled.

### FR-2: Host Flow — Create Room

- Input: host name (required, max 30 chars)
- **Question builder:** Form to add questions with:
  - Question text (required)
  - 4 option inputs (A, B, C, D — all required)
  - Correct answer selector (dropdown: Correct: A/B/C/D)
- "Add Question" button appends another question form.
- "Create Game" button:
  - Validates at least 1 question with all fields filled.
  - Generates a random 4-6 character room code.
  - POSTs room to `/rest/v1/rooms` and questions to `/rest/v1/questions`.
  - Transitions to lobby screen.

### FR-3: Host Flow — Lobby

- Shows room code prominently (shareable).
- "Share this code with your players" subtitle.
- Live player list (polled every 2 seconds).
- **"Start Game"** button — requires at least 1 player.
- On click: PATCHes room status to `playing`, current_question to `0`.

### FR-4: Join Flow

- Input: room code (text, auto-uppercase, max 6 chars)
- Input: player name (required, max 30 chars)
- "Join" button:
  - Looks up room by code. Must be in `lobby` status.
  - POSTs player to `/rest/v1/players`.
  - If name is taken (unique constraint), shows "That name is taken in this room."
  - Transitions to player lobby.

### FR-5: Player Lobby

- Shows room code and "Waiting for host to start..."
- Live player list (polled every 2 seconds).
- Polls room status every 2 seconds. When status changes to `playing`, auto-transitions to question screen.

### FR-6: Question Screen

- Shows: question number ("Question X of Y"), question text, countdown timer, 4 option buttons.
- **Timer:** Counts down from question's `time_limit` (default 20s). Turns red at 5s or below.
- **Options:** 4 buttons labeled A, B, C, D with option text. Keyboard input supported (A/B/C/D or 1/2/3/4).
- **On answer:**
  - Buttons disable.
  - Selected button highlighted.
  - Answer recorded: POST to `/rest/v1/answers`.
  - Score calculated: correct = 100 points + time bonus (faster = more points, via `increment_score` RPC).
  - Shows "Answer submitted! Waiting for results..."
- **On timeout (no answer):**
  - Buttons disable.
  - Shows "Time's up!"
  - No points awarded.

### FR-7: Host Question View

- Host sees the same question screen but CANNOT answer.
- When timer expires, host sees results: correct answer highlighted, stats ("X of Y got it right").
- **"Next Question"** button advances to next question (PATCHes `current_question` on room).
- After last question: PATCHes room status to `finished`, shows final scoreboard.

### FR-8: Player Question Progression

- After submitting answer, player polls room's `current_question` value every 2 seconds.
- When it increments, player auto-transitions to the next question.
- When room status is `finished`, player auto-transitions to scoreboard.

### FR-9: Final Scoreboard

- Shows all players ranked by score (descending).
- Uses rank numbers or medals (1st, 2nd, 3rd).
- Current player's name highlighted.
- **"Play Again"** button returns to home screen.

### FR-10: Scoring

- Correct answer: 100 base points + time bonus.
- Time bonus: `Math.round(timeLeft * 5)` — e.g., answering with 15s left = 100 + 75 = 175 points.
- Uses `increment_score(p_player_id, p_points)` RPC function from template for atomic updates.

### FR-11: Demo Rooms — Auto-Reset (demo-specific)

- 3 pre-seeded demo rooms (DEMO1, DEMO2, DEMO3) with 10 questions each.
- When a demo room reaches `finished` status, it auto-resets:
  - After a 30-second delay, the room's status is reset to `lobby`, `current_question` to `0`.
  - All players and answers are deleted (CASCADE from room relationships, or explicit DELETE).
  - Questions persist (they are the seed data).
- **Implementation:** Client-side — when the scoreboard shows for a demo room, a setTimeout triggers PATCHes to reset the room. Alternatively, a DB trigger on room status change.
- Demo rooms are protected from the cleanup trigger (identified by code IN ('DEMO1', 'DEMO2', 'DEMO3')).

### FR-12: Demo Notice Banner

- Yellow banner: "Live demo — join a room and answer trivia! Rooms auto-delete after 2 hours."

### FR-13: Footer

- "Built with bld402 · Powered by run402" with links.

## Schema

Based on template `schema.sql`. Differences noted:

```sql
CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  host_name text NOT NULL,
  status text DEFAULT 'lobby',
  current_question integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  options jsonb NOT NULL,
  correct_index integer NOT NULL,
  time_limit integer DEFAULT 20,
  sort_order integer NOT NULL
);

CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  name text NOT NULL,
  score integer DEFAULT 0,
  joined_at timestamptz DEFAULT now()
);

CREATE TABLE answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  selected_index integer NOT NULL,
  is_correct boolean DEFAULT false,
  answered_at timestamptz DEFAULT now(),
  UNIQUE(question_id, player_id)
);

-- Indexes
CREATE INDEX idx_rooms_code ON rooms(code);
CREATE INDEX idx_questions_room ON questions(room_id, sort_order);
CREATE INDEX idx_players_room ON players(room_id);
CREATE INDEX idx_answers_question ON answers(question_id);

-- Atomic score increment
CREATE OR REPLACE FUNCTION increment_score(p_player_id uuid, p_points integer)
RETURNS void AS $$
  UPDATE players SET score = score + p_points WHERE id = p_player_id;
$$ LANGUAGE sql;
```

**This matches the template exactly.** No schema modifications needed.

### Auto-cleanup (demo-specific)

```sql
CREATE OR REPLACE FUNCTION cleanup_rooms() RETURNS trigger AS $$
BEGIN
  DELETE FROM rooms
  WHERE created_at < now() - interval '2 hours'
    AND code NOT IN ('DEMO1', 'DEMO2', 'DEMO3');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cleanup_rooms
  AFTER INSERT ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_rooms();
```

### Seed Data

3 demo rooms with 10 questions each (30 questions total). See `seed.sql` for full content.

- **DEMO1** — General Knowledge: solar system, continents, elements, countries, history, anatomy, capitals, planets, physics, oceans
- **DEMO2** — Movies & TV: classic films, Game of Thrones, directors, The Office, Titanic, Finding Nemo, Breaking Bad, MCU, Star Wars, Stranger Things
- **DEMO3** — Food & Drink: sushi, durian, hummus, coffee, pasta, Scoville, tea, marzipan, pizza, saffron

## RLS

Exactly matches template `rls.json`:
- `public_read_write` on all 4 tables (rooms, questions, players, answers)
- Required for multiplayer access without auth.

## Color Theme

Template uses purple (#5b21b6). Showcase changes to bld402 blue (#0066cc) for consistency with other showcase apps.

**Files affected:** Only CSS color values in index.html. No functional changes.

## Pinned Demo Modifications

1. **Project pinned** — lease never expires
2. **Cleanup trigger** — 2h expiry for non-demo rooms
3. **Demo room auto-reset** — finished demo rooms reset to lobby after 30s
4. **Demo notice banner** — added to HTML
5. **Color change** — purple to blue (#0066cc)
6. **Demo room cards** — home screen shows pre-loaded rooms

## Acceptance Criteria

- [ ] Home screen shows Host/Join buttons and 3 demo room cards
- [ ] Host can create room with custom questions
- [ ] Room code is generated and displayed
- [ ] Players can join by code and name
- [ ] Duplicate player names rejected with error message
- [ ] Host lobby shows live player list (polls every 2s)
- [ ] Host can start game (requires 1+ players)
- [ ] Questions display with countdown timer
- [ ] Timer turns red at 5s
- [ ] Clicking option or typing A/B/C/D submits answer
- [ ] Correct answers earn 100 + time bonus points
- [ ] Host sees results after timer expires and can advance
- [ ] Players auto-advance when host moves to next question
- [ ] Final scoreboard shows all players ranked by score
- [ ] Demo rooms (DEMO1/2/3) auto-reset to lobby after game finishes
- [ ] User-created rooms auto-delete after 2 hours
- [ ] Demo notice banner visible
- [ ] Footer shows bld402 + run402 links
- [ ] **Viewport fitting:** Each screen fits in one viewport without page-level scroll (100dvh, flex layout)
- [ ] **Responsive:** Options grid switches to single column on narrow screens (< 600px)
- [ ] Page accessible at trivia.run402.com
- [ ] **Repeatability:** A fresh project built from `templates/games/trivia-night/` produces a working trivia game

## Template Repeatability

**The key value of each showcase app is proving that the template works.** Anyone following the bld402 steps with this template MUST be able to reach the same functional result. The only differences between a fresh build and the showcase are the pinned demo modifications listed above.

**Red Team must validate both:**
1. **The live demo** at trivia.run402.com — test all acceptance criteria above.
2. **A fresh build from scratch** — follow bld402.com steps using `templates/games/trivia-night/`, provision a new project, deploy, and verify the template produces a working app with the same core functionality (host/join, questions, timer, scoring, scoreboard).
