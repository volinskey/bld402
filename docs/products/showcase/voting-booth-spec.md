---
product: voting-booth
type: feature
version: "1.0"
template: templates/utility/voting-booth/
---

# Showcase: Voting Booth

Live demo at **vote.run402.com** — a live polling app with animated results.

## Source Template

`templates/utility/voting-booth/` (schema.sql, index.html, rls.json)

The showcase is built FROM this template with demo-specific modifications listed below.

## Functional Requirements

### FR-1: Poll Display

- On page load, the demo poll is displayed: **"What's the best pizza topping?"**
- 5 options shown as clickable cards: Pepperoni, Mushrooms, Pineapple, Extra Cheese, Olives.
- **No create-poll UI in the showcase.** The template supports poll creation, but the demo only shows the pre-loaded poll (see Pinned Demo Modifications).
- If no poll exists (error state), show "No poll available."

### FR-2: Voting

- Each option is a clickable card/button.
- Clicking an option submits the vote immediately (no confirmation step needed).
- Vote is POSTed to `/rest/v1/votes` with `{ poll_id, option_id, voter_id }`.
- `voter_id` is a browser-generated UUID stored in `localStorage` key `voter_id`.
- **One vote per person:** Enforced by `UNIQUE(poll_id, voter_id)` constraint.
- On duplicate vote (409): silently show results (user already voted).

### FR-3: Results Display

- **Results are hidden until the visitor votes.** (No peeking.)
- After voting, the poll transitions to show animated bar chart results:
  - Each option shows: label, vote count, percentage, horizontal bar.
  - The voter's selected option is highlighted (e.g., "Your vote" badge or different color).
  - Bars animate from 0% to their final width.
- **Total votes** shown below bars (e.g., "42 total votes").

### FR-4: Live Results Refresh

- After voting, results auto-refresh every 3-5 seconds.
- New votes from other visitors cause bars to animate to new widths.
- Visual indicator that results are live (e.g., subtle "Live" dot or text).

### FR-5: Already-Voted State

- On page load, check if `voter_id` exists in localStorage.
- If so, query `/rest/v1/votes?poll_id=eq.X&voter_id=eq.Y` to check if already voted.
- If already voted: skip vote UI, show results directly.

### FR-6: Demo Notice Banner

- Yellow banner: "Live demo — cast your vote! One vote per person."

### FR-7: Footer

- "Built with bld402 · Powered by run402" with links.

## Schema

Exactly matches template `schema.sql`:

```sql
CREATE TABLE polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_by text,
  multiple_choice boolean DEFAULT false,
  closed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES polls(id) ON DELETE CASCADE,
  label text NOT NULL,
  sort_order integer DEFAULT 0
);

CREATE TABLE votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES polls(id) ON DELETE CASCADE,
  option_id uuid REFERENCES options(id) ON DELETE CASCADE,
  voter_id text NOT NULL,
  voted_at timestamptz DEFAULT now(),
  UNIQUE(poll_id, voter_id)
);

CREATE INDEX idx_options_poll ON options(poll_id, sort_order);
CREATE INDEX idx_votes_poll ON votes(poll_id);
CREATE INDEX idx_votes_option ON votes(option_id);
```

**This matches the template exactly.** No schema modifications needed.

### Seed Data

One demo poll with pre-loaded votes:

```sql
-- Demo poll
INSERT INTO polls (id, title, description, created_by) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'What''s the best pizza topping?',
   'The eternal debate, settled by popular vote.',
   'bld402 Demo');

-- 5 options
INSERT INTO options (id, poll_id, label, sort_order) VALUES
  ('11111111-aaaa-bbbb-cccc-100000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Pepperoni', 0),
  ('11111111-aaaa-bbbb-cccc-100000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Mushrooms', 1),
  ('11111111-aaaa-bbbb-cccc-100000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Pineapple', 2),
  ('11111111-aaaa-bbbb-cccc-100000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Extra Cheese', 3),
  ('11111111-aaaa-bbbb-cccc-100000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Olives', 4);

-- ~28 seed votes distributed across options:
-- Pepperoni: 9, Mushrooms: 6, Pineapple: 5, Extra Cheese: 5, Olives: 3
-- Each vote uses a unique seed-voter-NN voter_id
```

## RLS

Exactly matches template `rls.json`:
- `public_read_write` on all 3 tables (polls, options, votes)
- One-vote-per-user enforced by UNIQUE constraint.

**Note:** Since the showcase removes the create-poll UI, the `public_read_write` on `polls` is more permissive than needed. However, keeping it matches the template faithfully. The UI simply doesn't expose poll creation.

## Pinned Demo Modifications

1. **Project pinned** — lease never expires
2. **Create-poll UI removed** — showcase shows only the demo poll (template supports it, we just don't render the create form)
3. **Vote-first-then-results** — results hidden until visitor votes (template shows results immediately)
4. **Seed votes** — 28 pre-loaded votes so bars have data on first visit
5. **Demo notice banner** — added to HTML

## Acceptance Criteria

- [ ] Page loads showing the pizza topping poll with 5 options
- [ ] Options are clickable cards (no results visible yet)
- [ ] Clicking an option submits the vote
- [ ] After voting, animated bar chart appears with percentages
- [ ] Voter's selected option is visually highlighted
- [ ] Seed votes are reflected in the bars (~28 total + user's vote)
- [ ] Total vote count displayed below bars
- [ ] Results auto-refresh every 3-5 seconds
- [ ] Returning to page (same browser) shows results directly (already voted)
- [ ] Voting again (same browser) is silently rejected (unique constraint)
- [ ] Different browser/incognito can cast a separate vote
- [ ] No create-poll UI visible
- [ ] Demo notice banner visible
- [ ] Footer shows bld402 + run402 links
- [ ] **Viewport fitting:** Poll card fits in one screen without page-level scroll (100dvh, flex layout)
- [ ] **Responsive:** Poll card adapts to mobile (< 600px) with reduced padding
- [ ] Page accessible at vote.run402.com
- [ ] **Repeatability:** A fresh project built from `templates/utility/voting-booth/` produces a working voting app

## Template Repeatability

**The key value of each showcase app is proving that the template works.** Anyone following the bld402 steps with this template MUST be able to reach the same functional result. The only differences between a fresh build and the showcase are the pinned demo modifications listed above.

**Red Team must validate both:**
1. **The live demo** at vote.run402.com — test all acceptance criteria above.
2. **A fresh build from scratch** — follow bld402.com steps using `templates/utility/voting-booth/`, provision a new project, deploy, and verify the template produces a working app with the same core functionality (create poll, vote, see results, one-vote-per-person).
