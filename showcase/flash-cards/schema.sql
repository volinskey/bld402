-- =============================================================
-- Flash Cards — FROM template: templates/utility/flash-cards/schema.sql
-- =============================================================

-- Template schema (with demo-specific additions)
CREATE TABLE decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) <= 100),
  description text CHECK (char_length(description) <= 300),
  user_id uuid,
  is_public boolean DEFAULT false,
  is_seed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid REFERENCES decks(id) ON DELETE CASCADE,
  front text NOT NULL CHECK (char_length(front) <= 500),
  back text NOT NULL CHECK (char_length(back) <= 500),
  sort_order integer DEFAULT 0
);

CREATE TABLE progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid REFERENCES cards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  ease_factor numeric DEFAULT 2.5,
  interval_days numeric DEFAULT 0,
  next_review timestamptz DEFAULT now(),
  review_count integer DEFAULT 0
);

CREATE INDEX idx_decks_user ON decks(user_id);
CREATE INDEX idx_decks_public ON decks(is_public);
CREATE INDEX idx_cards_deck ON cards(deck_id);
CREATE INDEX idx_progress_user_card ON progress(user_id, card_id);

-- =============================================================
-- Demo modifications (per flash-cards-spec.md)
-- =============================================================

-- Auto-cleanup: 1h expiry + 10-deck cap for non-seed decks
CREATE OR REPLACE FUNCTION cleanup_flash_cards() RETURNS trigger AS $$
BEGIN
  -- Delete non-seed decks older than 1 hour (cascades to cards)
  DELETE FROM decks WHERE is_seed = false AND created_at < now() - interval '1 hour';
  -- Cap non-seed decks at 10 (delete oldest beyond limit)
  DELETE FROM decks WHERE id IN (
    SELECT id FROM decks
    WHERE is_seed = false
    ORDER BY created_at DESC
    OFFSET 10
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cleanup_decks
  AFTER INSERT ON decks
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_flash_cards();
