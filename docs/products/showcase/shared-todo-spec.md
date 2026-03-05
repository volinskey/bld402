---
product: shared-todo
type: feature
version: "1.0"
template: templates/utility/shared-todo/
---

# Showcase: Shared Todo List

Live demo at **todo.run402.com** — a collaborative task list anyone can edit.

## Source Template

`templates/utility/shared-todo/` (schema.sql, index.html, rls.json)

The showcase is built FROM this template with demo-specific modifications listed below.

## Functional Requirements

### FR-1: Add Task

- Text input at top with "Add" button.
- **Validation:** Task text is required. Max 200 characters. Empty submissions are blocked client-side.
- On submit: POST to `/rest/v1/todos` with `{ task, assigned_to }`.
- Task appears immediately at top of list (optimistic insert into local array + re-render).
- `assigned_to` is populated from the nickname field (FR-5). If no nickname set, `assigned_to` is null.

### FR-2: Toggle Done

- Each task has a checkbox.
- Clicking toggles the `done` boolean via PATCH.
- Done tasks show with strikethrough text and reduced opacity.
- **Seed tasks:** Toggling seed tasks IS allowed (they can be checked/unchecked but not deleted).

### FR-3: Delete Task

- Each non-seed task has a red "x" delete button.
- Clicking sends DELETE to the API and removes from the local list.
- **Seed tasks have no delete button.** They are protected (see FR-6).

### FR-4: Filters

- Three filter buttons: **All** | **Active** | **Done**
- Filters apply client-side to the local array.
- Active filter is visually highlighted (blue background).
- "All" is selected by default.

### FR-5: Nickname

- A "Your name" text input above the task form.
- Value persisted to `localStorage` key `bld402_todo_nickname`.
- On page load, nickname is restored from localStorage.
- When adding a task, the nickname value is sent as `assigned_to`.
- Nickname appears as a gray pill badge on each task that has one.

### FR-6: Seed Tasks (demo-specific)

- 3 pre-loaded demo tasks from seed.sql:
  1. "Buy groceries for the team lunch" — assigned to "Alex"
  2. "Review the project proposal" — assigned to "Jordan"
  3. "Set up the demo environment" — assigned to "Sam"
- Seed tasks have `is_seed = true` in the database.
- **UI indicators:** Seed tasks show a blue "demo" badge.
- **Protection:** Seed tasks have NO delete button. They can be toggled (checked/unchecked).
- **DB protection:** DELETE RLS policy excludes `is_seed = true` rows.

### FR-7: Auto-Polling

- Every 5 seconds, re-fetch all todos from the API.
- This shows updates from other visitors in near-real-time.
- Every 30 seconds, re-render to update fade effects and time-remaining labels.

### FR-8: Task Fade & Time Remaining (demo-specific)

- Non-seed tasks show a "time remaining" label (e.g., "45m left", "2m left").
- Non-seed tasks visually fade as they approach expiry (opacity decreases from 1.0 to 0.4 over 1 hour).
- Seed tasks do not fade and have no time-remaining label.

### FR-9: Remaining Counter

- Header shows "X remaining" — count of tasks where `done = false`.

### FR-10: Demo Notice Banner

- Yellow banner at top: "This is a live demo — try adding tasks! User-added tasks fade after 1 hour."

### FR-11: Footer

- "Built with bld402 · Powered by run402" with links.

## Schema

Based on template `schema.sql` with demo-specific additions:

```sql
CREATE TABLE todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task text NOT NULL CHECK (char_length(task) <= 200),
  done boolean DEFAULT false,
  assigned_to text,
  user_id uuid,
  is_seed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_todos_user ON todos(user_id);
CREATE INDEX idx_todos_done ON todos(done);
```

**Differences from template:**
- Added `CHECK (char_length(task) <= 200)` — enforces max length at DB level
- Added `is_seed boolean DEFAULT false` — marks demo tasks

### Auto-cleanup (demo-specific)

```sql
CREATE OR REPLACE FUNCTION cleanup_todos() RETURNS trigger AS $$
BEGIN
  -- Delete non-seed tasks older than 1 hour
  DELETE FROM todos WHERE is_seed = false AND created_at < now() - interval '1 hour';
  -- Cap non-seed tasks at 20 (delete oldest beyond limit)
  DELETE FROM todos WHERE id IN (
    SELECT id FROM todos
    WHERE is_seed = false
    ORDER BY created_at DESC
    OFFSET 20
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cleanup_todos
  AFTER INSERT ON todos
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_todos();
```

### Seed Data

```sql
INSERT INTO todos (task, assigned_to, is_seed) VALUES
  ('Buy groceries for the team lunch', 'Alex', true),
  ('Review the project proposal', 'Jordan', true),
  ('Set up the demo environment', 'Sam', true);
```

## RLS

Based on template `rls.json` (`public_read_write`) with one modification:

- **SELECT:** anon can read all rows
- **INSERT:** anon can insert rows (is_seed defaults to false, so user can't inject seed tasks)
- **UPDATE:** anon can update all rows (for toggling done)
- **DELETE:** anon can delete rows WHERE `is_seed = false` only

The INSERT policy should ensure `is_seed` cannot be set to `true` by the client:
```sql
CREATE POLICY "anon_insert" ON todos FOR INSERT TO anon
  WITH CHECK (is_seed = false);
```

## Pinned Demo Modifications

1. **Project pinned** — lease never expires
2. **is_seed column** — protects demo tasks from deletion
3. **Cleanup trigger** — 1h expiry + 20-task cap for non-seed tasks
4. **Fade effect** — visual time-remaining indicator
5. **Demo notice banner** — added to HTML
6. **Nickname field** — uses template's `assigned_to` column

## Acceptance Criteria

- [ ] Page loads showing 3 seed tasks (Alex, Jordan, Sam)
- [ ] Can add a task with text up to 200 chars
- [ ] Empty task submission is blocked
- [ ] Tasks show nickname badge when assigned_to is set
- [ ] Nickname persists across page reloads (localStorage)
- [ ] Seed tasks show "demo" badge
- [ ] Seed tasks have no delete button
- [ ] Seed tasks can be toggled (checked/unchecked)
- [ ] Non-seed tasks show time remaining ("45m left")
- [ ] Non-seed tasks visually fade over 1 hour
- [ ] Filter buttons work (All/Active/Done)
- [ ] "X remaining" counter in header is accurate
- [ ] Polling updates list every 5 seconds
- [ ] Non-seed tasks auto-delete after 1 hour (DB trigger)
- [ ] Non-seed tasks capped at 20 (DB trigger)
- [ ] Demo notice banner visible at top
- [ ] Footer shows bld402 + run402 links
- [ ] **Viewport fitting:** App fits in one screen without page-level scroll (100dvh, flex layout); todo list scrolls within its container
- [ ] **Responsive:** Form stacks vertically on narrow screens (< 600px)
- [ ] Page accessible at todo.run402.com
- [ ] **Repeatability:** A fresh project built from `templates/utility/shared-todo/` produces a working todo app

## Template Repeatability

**The key value of each showcase app is proving that the template works.** Anyone following the bld402 steps with this template MUST be able to reach the same functional result. The only differences between a fresh build and the showcase are the pinned demo modifications listed above.

**Red Team must validate both:**
1. **The live demo** at todo.run402.com — test all acceptance criteria above.
2. **A fresh build from scratch** — follow bld402.com steps using `templates/utility/shared-todo/`, provision a new project, deploy, and verify the template produces a working app with the same core functionality (add tasks, toggle done, delete, filter).
