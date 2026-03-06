---
product: secret-santa
type: feature
version: "1.0"
template: templates/utility/secret-santa/
---

# Showcase: Secret Santa

Live demo at **santa.run402.com** — a gift exchange organizer showing a completed demo group.

## Source Template

`templates/utility/secret-santa/` (schema.sql, index.html, rls.json)

The showcase is built FROM this template with demo-specific modifications listed below.

## Functional Requirements

### FR-1: Landing Page

- Shows the app name, description, and three action buttons:
  - **Organize a Group** — starts the group creation flow (template default)
  - **Join a Group** — enter a group code to join (template default)
  - **View Demo** — navigates directly to the pre-seeded demo group (demo-specific)
- The "View Demo" button is visually distinct (secondary style) and labeled "See a completed exchange".

### FR-2: View Demo Group

- Displays the pre-seeded group "bld402 Team Holiday Exchange" in its completed (drawn) state.
- Shows group name, budget, member count, and status badge ("Drawn").
- Lists all 5 members with their display names and wishlists.
- Assignment reveal is available: clicking "Reveal" next to a member shows who they are assigned to give a gift to.

### FR-3: Group Creation (template feature)

- Auth enabled: users can sign up / log in.
- Organizer creates a group with a name and optional budget.
- Group receives a unique join code.
- **Note:** In the showcase, this works but is secondary to the demo group view.

### FR-4: Join Group (template feature)

- Users enter a group code to join.
- On join, user provides a display name and optional wishlist.
- Members see the group page with the member list.

### FR-5: Draw Names (template feature)

- Organizer clicks "Draw Names" when all members have joined.
- Algorithm assigns each member exactly one other member (no self-assignments).
- Group status changes from "open" to "drawn".
- Each member can reveal only their own assignment.

### FR-6: In-App Reveal Only

- No Telegram integration — assignments are revealed in-app.
- Each member clicks "Reveal My Match" to see who they are buying for.
- Reveal is tracked via `viewed_assignment` boolean on the members table.

### FR-7: Demo Group State (demo-specific)

- Pre-seeded group with `status = 'drawn'` and 5 members with complete assignments and wishlists:
  1. **Alex** — wants: "cozy socks" — assigned to give to Jordan
  2. **Jordan** — wants: "a good book" — assigned to give to Sam
  3. **Sam** — wants: "coffee beans" — assigned to give to Riley
  4. **Riley** — wants: "board game" — assigned to give to Casey
  5. **Casey** — wants: "plant" — assigned to give to Alex
- All members have `viewed_assignment = true` (fully revealed state).
- The demo group is viewable without authentication.

### FR-8: No Live Group Creation in Showcase

- While auth is enabled and the group creation flow exists, the showcase emphasizes the demo group.
- The "View Demo" button on the landing page is the primary call-to-action for visitors.

### FR-9: Demo Notice Banner

- Yellow banner at top: "This is a demo of a completed exchange. Build your own with bld402!"

### FR-10: Footer

- "Built with bld402 · Powered by run402" with links.

## Schema

Based on template `schema.sql`:

```sql
CREATE TABLE groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  budget text,
  organizer_id uuid,
  status text DEFAULT 'open' CHECK (status IN ('open', 'drawn')),
  is_seed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid,
  display_name text NOT NULL,
  wishlist text,
  assigned_to uuid,
  viewed_assignment boolean DEFAULT false,
  is_seed boolean DEFAULT false,
  joined_at timestamptz DEFAULT now()
);

CREATE INDEX idx_members_group ON members(group_id);
CREATE INDEX idx_groups_code ON groups(code);
```

**Differences from template:**
- Added `is_seed boolean DEFAULT false` on both tables — marks demo group and members

### Seed Data

```sql
-- Demo group
INSERT INTO groups (id, name, code, budget, status, is_seed) VALUES
  ('00000000-0000-0000-0000-000000000001', 'bld402 Team Holiday Exchange', 'BLD402DEMO', '$25', 'drawn', true);

-- Demo members (with circular assignment chain)
INSERT INTO members (id, group_id, display_name, wishlist, assigned_to, viewed_assignment, is_seed) VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Alex', 'cozy socks', '00000000-0000-0000-0000-000000000020', true, true),
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'Jordan', 'a good book', '00000000-0000-0000-0000-000000000030', true, true),
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', 'Sam', 'coffee beans', '00000000-0000-0000-0000-000000000040', true, true),
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', 'Riley', 'board game', '00000000-0000-0000-0000-000000000050', true, true),
  ('00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000001', 'Casey', 'plant', '00000000-0000-0000-0000-000000000010', true, true);
```

No auto-cleanup is needed since the demo group is static.

## RLS

Based on template `rls.json` with demo-specific modifications:

- **SELECT (groups):** anon can read seed groups; authenticated can read groups they organize or belong to
- **SELECT (members):** anon can read members of seed groups; authenticated can read members of their groups
- **INSERT (groups):** authenticated users can create groups (is_seed defaults to false)
- **INSERT (members):** authenticated users can join groups
- **UPDATE (groups):** authenticated organizer can update their group status
- **DELETE:** seed groups and seed members cannot be deleted

```sql
CREATE POLICY "anon_select_seed_groups" ON groups FOR SELECT TO anon
  USING (is_seed = true);

CREATE POLICY "anon_select_seed_members" ON members FOR SELECT TO anon
  USING (group_id IN (SELECT id FROM groups WHERE is_seed = true));
```

## Pinned Demo Modifications

1. **Project pinned** — lease never expires
2. **is_seed column** — protects demo group and members from deletion
3. **Pre-seeded group** — "bld402 Team Holiday Exchange" with status='drawn' and 5 members
4. **"View Demo" button** — added to landing page alongside Organize/Join
5. **Demo group viewable without auth** — anon SELECT policy for seed data
6. **Demo notice banner** — added to HTML
7. **No Telegram** — in-app reveal only

## Acceptance Criteria

- [ ] Landing page shows Organize, Join, and View Demo buttons
- [ ] "View Demo" button navigates to the pre-seeded group
- [ ] Demo group shows "bld402 Team Holiday Exchange" with status "Drawn"
- [ ] All 5 members (Alex, Jordan, Sam, Riley, Casey) are listed with wishlists
- [ ] Clicking "Reveal" on a member shows their assignment
- [ ] Assignment chain is a valid cycle (no self-assignments, everyone gives and receives)
- [ ] Demo group is viewable without authentication
- [ ] Auth bar shows Sign Up / Log In buttons
- [ ] Logged-in user can create a new group (template functionality works)
- [ ] Seed group and members cannot be deleted
- [ ] Demo notice banner visible at top
- [ ] Footer shows bld402 + run402 links
- [ ] **Viewport fitting:** App fits in one screen without page-level scroll (100dvh, flex layout)
- [ ] **Responsive:** Member list and group view adapt to narrow screens (< 600px)
- [ ] Page accessible at santa.run402.com
- [ ] **Repeatability:** A fresh project built from `templates/utility/secret-santa/` produces a working secret santa app

## Template Repeatability

**The key value of each showcase app is proving that the template works.** Anyone following the bld402 steps with this template MUST be able to reach the same functional result. The only differences between a fresh build and the showcase are the pinned demo modifications listed above.

**Red Team must validate both:**
1. **The live demo** at santa.run402.com — test all acceptance criteria above.
2. **A fresh build from scratch** — follow bld402.com steps using `templates/utility/secret-santa/`, provision a new project, deploy, and verify the template produces a working app with the same core functionality (create group, join with code, draw names, reveal assignments).
