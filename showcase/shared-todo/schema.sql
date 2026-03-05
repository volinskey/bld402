-- =============================================================
-- Shared Todo List — FROM template: templates/utility/shared-todo/schema.sql
-- =============================================================

-- Template schema (unmodified)
CREATE TABLE todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task text NOT NULL,
  done boolean DEFAULT false,
  assigned_to text,
  user_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_todos_user ON todos(user_id);
CREATE INDEX idx_todos_done ON todos(done);

-- =============================================================
-- Demo modifications (per shared-todo-spec.md)
-- =============================================================

-- Add is_seed column for seed task protection
ALTER TABLE todos ADD COLUMN is_seed boolean DEFAULT false;

-- Add length constraint (spec FR-1: max 200 chars)
ALTER TABLE todos ADD CONSTRAINT chk_task_length CHECK (char_length(task) <= 200);

-- Auto-cleanup: 1h expiry + 20-task cap for non-seed tasks
CREATE OR REPLACE FUNCTION cleanup_todos() RETURNS trigger AS $$
BEGIN
  DELETE FROM todos WHERE is_seed = false AND created_at < now() - interval '1 hour';
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
