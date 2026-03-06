-- =============================================================
-- Photo Wall — FROM template: templates/utility/photo-wall/schema.sql
-- =============================================================

-- Template schema (unmodified)
CREATE TABLE photos (
  id serial PRIMARY KEY,
  caption text CHECK (char_length(caption) <= 200),
  image_path text NOT NULL,
  user_id uuid NOT NULL,
  author_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_photos_created ON photos(created_at DESC);
CREATE INDEX idx_photos_user ON photos(user_id);

-- =============================================================
-- Demo modifications (per photo-wall-spec.md)
-- =============================================================

-- Add is_seed column for seed photo protection
ALTER TABLE photos ADD COLUMN is_seed boolean DEFAULT false;
