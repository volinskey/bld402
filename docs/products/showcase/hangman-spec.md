---
product: hangman
type: feature
version: "1.0"
template: templates/games/hangman/
---

# Showcase: Hangman

Live demo at **hangman.run402.com** — a classic word guessing game.

## Source Template

`templates/games/hangman/` (schema.sql, index.html, rls.json)

The showcase is built FROM this template with demo-specific modifications listed below.

## Functional Requirements

### FR-1: New Game

- On page load, a random word is fetched from the `word_lists` table via the API.
- A new game starts automatically — no "start" button needed.
- The word is stored client-side only (no game record in DB).

### FR-2: Difficulty Filter

- Three buttons: **Easy** | **Medium** | **Hard**
- Filters the word list query: `GET /rest/v1/word_lists?difficulty=eq.{level}`
- Default: no filter (random from all difficulties).
- Selecting a difficulty fetches a new word from that difficulty level and starts a new game.
- The template schema has a `difficulty` column with values: `easy`, `medium`, `hard`.

### FR-3: Word Display

- Each letter shown as an underscored slot (blank).
- Correctly guessed letters are revealed in their slots.
- On loss: all letters are revealed (unrevealed letters shown in a different color, e.g., red).

### FR-4: Guessing

- A-Z keyboard grid displayed on screen.
- Player can click a letter button OR type on their physical keyboard.
- After guessing:
  - If correct: letter button turns green, letter revealed in word display.
  - If wrong: letter button turns red, hangman part drawn.
  - Button becomes disabled (can't guess same letter twice).

### FR-5: Hangman Drawing

- SVG drawing with 6 stages: head, body, left arm, right arm, left leg, right leg.
- Scaffold (base, pole, top beam, rope) always visible.
- Body parts appear one at a time on each wrong guess.
- 6 wrong guesses = game over (loss).

### FR-6: Win/Loss

- **Win:** All letters revealed. Status message: "You won!" (green). "New Game" button appears.
- **Loss:** All letters revealed (with unrevealed in red). Status: `Game over! The word was "X"`. "New Game" button appears.
- All keyboard buttons disabled after game ends.
- "Wrong guesses: X / 6" counter shown below the drawing.

### FR-7: New Game Button

- Appears after win or loss.
- Clicking fetches a new random word (respecting current difficulty filter) and resets all state.

### FR-8: Category Display

- The template schema has a `category` column (animals, food, nature, objects, general).
- Category is displayed as a hint label near the word display (e.g., "Category: animals").

### FR-9: Demo Notice Banner

- Yellow banner at top: "Live demo — guess the word! 6 wrong guesses and you're out."

### FR-10: Footer

- "Built with bld402 · Powered by run402" with links.

## Schema

Exactly matches template `schema.sql`:

```sql
CREATE TABLE games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL,
  guesses text[] DEFAULT '{}',
  max_wrong integer DEFAULT 6,
  status text DEFAULT 'playing',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE word_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL,
  category text DEFAULT 'general',
  difficulty text DEFAULT 'medium'
);
```

**Note:** The `games` table exists in the template but is NOT used by the showcase. Game state is client-side only. The `games` table is still created (it's part of the template) but remains empty. The showcase only reads from `word_lists`.

### Seed Data

50 words across 3 difficulty levels (20 easy, 15 medium, 15 hard). The base 25 words come from the showcase schema.sql; the remaining 25 are added via `showcase/hangman/seed.sql`. All categories: animals, food, nature, objects, general.

**Difficulty breakdown:**
- **Easy** (4-7 letters): elephant, butterfly, penguin, dinosaur, giraffe, hamburger, icecream, keyboard, lemonade, mountain, notebook, octopus, rainbow, sandwich, umbrella, tiger, apple, cloud, piano, grape
- **Medium** (6-9 letters): crocodile, adventure, birthday, chocolate, fireworks, jellyfish, pineapple, telescope, volcano, waterfall, castle, bridge, rocket, garden, monkey
- **Hard** (8+ letters): xylophone, alligator, astronaut, blueberry, caterpillar, champagne, dangerous, education, fantastic, geography, hurricane, labyrinth, mushroom, orchestra, parachute

## RLS

Exactly matches template `rls.json`:

- `public_read_write` on `games` (template default, table unused by showcase)
- `public_read` on `word_lists` (anon can read words but not modify)

## Pinned Demo Modifications

1. **Project pinned** — lease never expires
2. **Demo notice banner** — added to HTML
3. **Difficulty filter UI** — uses template's existing difficulty column
4. **Category display** — uses template's existing category column

No schema modifications needed. The template schema is used as-is.

## Acceptance Criteria

- [ ] Page loads with a random word and empty hangman scaffold
- [ ] Clicking letter buttons reveals correct letters or draws hangman parts
- [ ] Physical keyboard input works (typing letters)
- [ ] Wrong guesses counter shows "Wrong guesses: X / 6"
- [ ] Category hint displayed (e.g., "Category: animals")
- [ ] After 6 wrong guesses: game over, word revealed in red, "New Game" button shown
- [ ] When all letters guessed: "You won!" message, "New Game" button shown
- [ ] Difficulty filter (Easy/Medium/Hard) fetches new word of that difficulty
- [ ] "New Game" button starts fresh game with new word
- [ ] Used letter buttons are disabled and color-coded (green=correct, red=wrong)
- [ ] SVG hangman draws correctly (6 body parts in order)
- [ ] Demo notice banner visible at top
- [ ] Footer shows bld402 + run402 links
- [ ] **Viewport fitting:** App fits in one screen without scrolling (100dvh, flex layout, compact spacing)
- [ ] **Responsive:** Keyboard and letter slots scale down on narrow screens (< 400px)
- [ ] Page accessible at hangman.run402.com
- [ ] **Repeatability:** A fresh project built from `templates/games/hangman/` produces a working hangman game

## Template Repeatability

**The key value of each showcase app is proving that the template works.** Anyone following the bld402 steps with this template MUST be able to reach the same functional result. The only differences between a fresh build and the showcase are the pinned demo modifications listed above.

**Red Team must validate both:**
1. **The live demo** at hangman.run402.com — test all acceptance criteria above.
2. **A fresh build from scratch** — follow bld402.com steps using `templates/games/hangman/`, provision a new project, deploy, and verify the template produces a working app with the same core functionality (random word, letter guessing, win/loss, SVG drawing).
