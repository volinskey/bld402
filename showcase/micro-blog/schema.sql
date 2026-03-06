-- =============================================================
-- Micro-Blog — FROM template: templates/utility/micro-blog/schema.sql
-- =============================================================

-- Template schema (unmodified)
CREATE TABLE posts (
  id serial PRIMARY KEY,
  body text NOT NULL CHECK (char_length(body) <= 500),
  image_path text,
  user_id uuid NOT NULL,
  author_name text NOT NULL,
  likes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_user ON posts(user_id);

-- =============================================================
-- Demo modifications (per micro-blog-spec.md)
-- =============================================================

-- Add is_seed column for seed post protection
ALTER TABLE posts ADD COLUMN is_seed boolean DEFAULT false;

-- Auto-cleanup: 1h expiry + 20-post cap for non-seed posts
CREATE OR REPLACE FUNCTION cleanup_posts() RETURNS trigger AS $$
BEGIN
  DELETE FROM posts WHERE is_seed = false AND created_at < now() - interval '1 hour';
  DELETE FROM posts WHERE id IN (
    SELECT id FROM posts
    WHERE is_seed = false
    ORDER BY created_at DESC
    OFFSET 20
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cleanup_posts
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_posts();
