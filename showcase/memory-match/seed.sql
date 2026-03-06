-- Seed data — card sets + card images + leaderboard scores

-- Card sets
INSERT INTO card_sets (id, name, difficulty) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'Animals', 'easy'),
  ('c0000001-0000-0000-0000-000000000002', 'Space', 'medium'),
  ('c0000001-0000-0000-0000-000000000003', 'Ocean', 'hard');

-- Animals card images (6 pairs)
INSERT INTO card_images (card_set_id, prompt, image_path, pair_index) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'happy otter', 'animals/0.png', 0),
  ('c0000001-0000-0000-0000-000000000001', 'sleepy fox', 'animals/1.png', 1),
  ('c0000001-0000-0000-0000-000000000001', 'dancing penguin', 'animals/2.png', 2),
  ('c0000001-0000-0000-0000-000000000001', 'curious owl', 'animals/3.png', 3),
  ('c0000001-0000-0000-0000-000000000001', 'playful kitten', 'animals/4.png', 4),
  ('c0000001-0000-0000-0000-000000000001', 'brave puppy', 'animals/5.png', 5);

-- Space card images (8 pairs)
INSERT INTO card_images (card_set_id, prompt, image_path, pair_index) VALUES
  ('c0000001-0000-0000-0000-000000000002', 'ringed planet', 'space/0.png', 0),
  ('c0000001-0000-0000-0000-000000000002', 'spiral galaxy', 'space/1.png', 1),
  ('c0000001-0000-0000-0000-000000000002', 'astronaut cat', 'space/2.png', 2),
  ('c0000001-0000-0000-0000-000000000002', 'rocket ship', 'space/3.png', 3),
  ('c0000001-0000-0000-0000-000000000002', 'shooting star', 'space/4.png', 4),
  ('c0000001-0000-0000-0000-000000000002', 'moon crater', 'space/5.png', 5),
  ('c0000001-0000-0000-0000-000000000002', 'alien plant', 'space/6.png', 6),
  ('c0000001-0000-0000-0000-000000000002', 'space station', 'space/7.png', 7);

-- Ocean card images (10 pairs)
INSERT INTO card_images (card_set_id, prompt, image_path, pair_index) VALUES
  ('c0000001-0000-0000-0000-000000000003', 'coral reef', 'ocean/0.png', 0),
  ('c0000001-0000-0000-0000-000000000003', 'deep sea fish', 'ocean/1.png', 1),
  ('c0000001-0000-0000-0000-000000000003', 'sea turtle', 'ocean/2.png', 2),
  ('c0000001-0000-0000-0000-000000000003', 'jellyfish', 'ocean/3.png', 3),
  ('c0000001-0000-0000-0000-000000000003', 'octopus', 'ocean/4.png', 4),
  ('c0000001-0000-0000-0000-000000000003', 'seahorse', 'ocean/5.png', 5),
  ('c0000001-0000-0000-0000-000000000003', 'whale shark', 'ocean/6.png', 6),
  ('c0000001-0000-0000-0000-000000000003', 'manta ray', 'ocean/7.png', 7),
  ('c0000001-0000-0000-0000-000000000003', 'clownfish', 'ocean/8.png', 8),
  ('c0000001-0000-0000-0000-000000000003', 'starfish', 'ocean/9.png', 9);

-- Seed leaderboard scores: Easy (10 scores)
INSERT INTO scores (player_name, difficulty, moves, time_seconds) VALUES
  ('MemoryMaster', 'easy', 8, 15),
  ('QuickFlip', 'easy', 9, 18),
  ('CardShark', 'easy', 10, 22),
  ('BrainTeaser', 'easy', 11, 25),
  ('FlipWiz', 'easy', 12, 28),
  ('PairPro', 'easy', 13, 30),
  ('MatchKing', 'easy', 14, 33),
  ('SharpEye', 'easy', 15, 36),
  ('FastHands', 'easy', 16, 40),
  ('LuckyGuess', 'easy', 18, 45);

-- Seed leaderboard scores: Medium (10 scores)
INSERT INTO scores (player_name, difficulty, moves, time_seconds) VALUES
  ('MemoryMaster', 'medium', 14, 30),
  ('CardShark', 'medium', 16, 38),
  ('QuickFlip', 'medium', 18, 42),
  ('BrainTeaser', 'medium', 20, 50),
  ('FlipWiz', 'medium', 22, 55),
  ('PairPro', 'medium', 24, 62),
  ('MatchKing', 'medium', 25, 68),
  ('SharpEye', 'medium', 26, 72),
  ('FastHands', 'medium', 28, 80),
  ('LuckyGuess', 'medium', 30, 90);

-- Seed leaderboard scores: Hard (10 scores)
INSERT INTO scores (player_name, difficulty, moves, time_seconds) VALUES
  ('MemoryMaster', 'hard', 20, 45),
  ('QuickFlip', 'hard', 24, 58),
  ('CardShark', 'hard', 28, 70),
  ('BrainTeaser', 'hard', 32, 85),
  ('FlipWiz', 'hard', 35, 95),
  ('PairPro', 'hard', 38, 110),
  ('MatchKing', 'hard', 40, 125),
  ('SharpEye', 'hard', 42, 140),
  ('FastHands', 'hard', 46, 160),
  ('LuckyGuess', 'hard', 50, 180);
