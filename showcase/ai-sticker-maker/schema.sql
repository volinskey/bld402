-- =============================================================
-- AI Sticker Maker — FROM template: templates/games/ai-sticker-maker/schema.sql
-- =============================================================

-- Template schema (unmodified)
CREATE TABLE stickers (
  id serial PRIMARY KEY,
  prompt text NOT NULL CHECK (char_length(prompt) <= 200),
  image_path text NOT NULL,
  creator_name text DEFAULT 'Anonymous',
  likes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_stickers_created ON stickers(created_at DESC);

-- =============================================================
-- Demo modifications (per ai-sticker-maker-spec.md)
-- =============================================================

-- Add is_seed column for seed sticker protection
ALTER TABLE stickers ADD COLUMN is_seed boolean DEFAULT false;

-- Auto-cleanup: 1h expiry + 30-sticker cap for non-seed stickers
CREATE OR REPLACE FUNCTION cleanup_stickers() RETURNS trigger AS $$
BEGIN
  DELETE FROM stickers WHERE is_seed = false AND created_at < now() - interval '1 hour';
  DELETE FROM stickers WHERE id IN (
    SELECT id FROM stickers
    WHERE is_seed = false
    ORDER BY created_at DESC
    OFFSET 30
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cleanup_stickers
  AFTER INSERT ON stickers
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_stickers();
