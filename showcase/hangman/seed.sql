-- Seed data for Hangman showcase
-- 50 words across easy (20), medium (15), and hard (15) difficulties

-- Additional easy words (beyond schema.sql defaults)
INSERT INTO word_lists (word, category, difficulty) VALUES
  ('tiger', 'animals', 'easy'),
  ('apple', 'food', 'easy'),
  ('cloud', 'nature', 'easy'),
  ('piano', 'objects', 'easy'),
  ('grape', 'food', 'easy')
ON CONFLICT DO NOTHING;

-- Additional medium words
INSERT INTO word_lists (word, category, difficulty) VALUES
  ('castle', 'objects', 'medium'),
  ('bridge', 'objects', 'medium'),
  ('rocket', 'objects', 'medium'),
  ('garden', 'nature', 'medium'),
  ('monkey', 'animals', 'medium')
ON CONFLICT DO NOTHING;

-- Hard words (8+ letters)
INSERT INTO word_lists (word, category, difficulty) VALUES
  ('xylophone', 'objects', 'hard'),
  ('alligator', 'animals', 'hard'),
  ('astronaut', 'general', 'hard'),
  ('blueberry', 'food', 'hard'),
  ('caterpillar', 'animals', 'hard'),
  ('champagne', 'food', 'hard'),
  ('dangerous', 'general', 'hard'),
  ('education', 'general', 'hard'),
  ('fantastic', 'general', 'hard'),
  ('geography', 'general', 'hard'),
  ('hurricane', 'nature', 'hard'),
  ('labyrinth', 'general', 'hard'),
  ('mushroom', 'food', 'hard'),
  ('orchestra', 'general', 'hard'),
  ('parachute', 'objects', 'hard')
ON CONFLICT DO NOTHING;
