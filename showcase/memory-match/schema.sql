-- =============================================================
-- Memory Match — FROM template: templates/games/memory-match/schema.sql
-- =============================================================

-- Template schema (unmodified)
CREATE TABLE card_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE card_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_set_id uuid REFERENCES card_sets(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  image_path text NOT NULL,
  pair_index integer NOT NULL
);

CREATE TABLE scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL CHECK (char_length(player_name) <= 20),
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  moves integer NOT NULL,
  time_seconds integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_card_images_set ON card_images(card_set_id);
CREATE INDEX idx_scores_difficulty ON scores(difficulty, moves, time_seconds);
