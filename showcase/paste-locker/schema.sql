-- Paste Locker schema (from template)
CREATE TABLE notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text DEFAULT 'Untitled',
  content_encrypted text NOT NULL,
  password_hash text,
  burn_after_read boolean DEFAULT false,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX idx_notes_code ON notes(code);

-- Demo cleanup: auto-delete notes older than 1 hour (except seed note)
CREATE OR REPLACE FUNCTION cleanup_old_notes() RETURNS trigger AS $$
BEGIN
  DELETE FROM notes
  WHERE code != 'demo1234'
    AND created_at < now() - interval '1 hour';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cleanup_notes
  AFTER INSERT ON notes
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_old_notes();
