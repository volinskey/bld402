-- =============================================================
-- Bingo Card Generator — FROM template: templates/games/bingo-card-generator/schema.sql
-- =============================================================

-- Template schema (unmodified)
CREATE TABLE games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) <= 100),
  code text NOT NULL UNIQUE,
  host_name text NOT NULL CHECK (char_length(host_name) <= 50),
  status text NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'playing', 'finished')),
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

-- =============================================================
-- Demo modifications (per bingo-card-generator-spec.md)
-- =============================================================

-- Add is_seed column for seed game protection
ALTER TABLE games ADD COLUMN is_seed boolean DEFAULT false;

-- Auto-cleanup: 1h expiry + 5-game cap for non-seed games
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
