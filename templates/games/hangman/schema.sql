-- Hangman — Database Schema
-- Stores game state for solo or pass-and-play hangman

CREATE TABLE games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL,
  guesses text[] DEFAULT '{}',
  max_wrong integer DEFAULT 6,
  status text DEFAULT 'playing',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE word_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL,
  category text DEFAULT 'general',
  difficulty text DEFAULT 'medium'
);

-- Seed with default words
INSERT INTO word_lists (word, category, difficulty) VALUES
  ('elephant', 'animals', 'easy'),
  ('butterfly', 'animals', 'medium'),
  ('crocodile', 'animals', 'medium'),
  ('penguin', 'animals', 'easy'),
  ('adventure', 'general', 'medium'),
  ('birthday', 'general', 'easy'),
  ('chocolate', 'food', 'medium'),
  ('dinosaur', 'animals', 'easy'),
  ('fireworks', 'general', 'medium'),
  ('giraffe', 'animals', 'easy'),
  ('hamburger', 'food', 'easy'),
  ('icecream', 'food', 'easy'),
  ('jellyfish', 'animals', 'medium'),
  ('keyboard', 'objects', 'easy'),
  ('lemonade', 'food', 'easy'),
  ('mountain', 'nature', 'easy'),
  ('notebook', 'objects', 'easy'),
  ('octopus', 'animals', 'easy'),
  ('pineapple', 'food', 'medium'),
  ('rainbow', 'nature', 'easy'),
  ('sandwich', 'food', 'easy'),
  ('telescope', 'objects', 'medium'),
  ('umbrella', 'objects', 'easy'),
  ('volcano', 'nature', 'medium'),
  ('waterfall', 'nature', 'medium');
