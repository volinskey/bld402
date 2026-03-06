-- Seed data — card sets + card images + leaderboard scores

-- Card sets
INSERT INTO card_sets (id, name, difficulty) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'Animals', 'easy'),
  ('c0000001-0000-0000-0000-000000000002', 'Space', 'medium'),
  ('c0000001-0000-0000-0000-000000000003', 'Ocean', 'hard');

-- Animals card images (6 pairs)
INSERT INTO card_images (card_set_id, prompt, image_path, pair_index) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'happy otter', 'memory-match/animals/0.png', 0),
  ('c0000001-0000-0000-0000-000000000001', 'sleepy fox', 'memory-match/animals/1.png', 1),
  ('c0000001-0000-0000-0000-000000000001', 'dancing penguin', 'memory-match/animals/2.png', 2),
  ('c0000001-0000-0000-0000-000000000001', 'curious owl', 'memory-match/animals/3.png', 3),
  ('c0000001-0000-0000-0000-000000000001', 'playful kitten', 'memory-match/animals/4.png', 4),
  ('c0000001-0000-0000-0000-000000000001', 'brave puppy', 'memory-match/animals/5.png', 5);

-- Space card images (8 pairs)
INSERT INTO card_images (card_set_id, prompt, image_path, pair_index) VALUES
  ('c0000001-0000-0000-0000-000000000002', 'ringed planet', 'memory-match/space/0.png', 0),
  ('c0000001-0000-0000-0000-000000000002', 'spiral galaxy', 'memory-match/space/1.png', 1),
  ('c0000001-0000-0000-0000-000000000002', 'astronaut cat', 'memory-match/space/2.png', 2),
  ('c0000001-0000-0000-0000-000000000002', 'rocket ship', 'memory-match/space/3.png', 3),
  ('c0000001-0000-0000-0000-000000000002', 'shooting star', 'memory-match/space/4.png', 4),
  ('c0000001-0000-0000-0000-000000000002', 'moon crater', 'memory-match/space/5.png', 5),
  ('c0000001-0000-0000-0000-000000000002', 'alien plant', 'memory-match/space/6.png', 6),
  ('c0000001-0000-0000-0000-000000000002', 'space station', 'memory-match/space/7.png', 7);

-- Ocean card images (10 pairs)
INSERT INTO card_images (card_set_id, prompt, image_path, pair_index) VALUES
  ('c0000001-0000-0000-0000-000000000003', 'coral reef', 'memory-match/ocean/0.png', 0),
  ('c0000001-0000-0000-0000-000000000003', 'deep sea fish', 'memory-match/ocean/1.png', 1),
  ('c0000001-0000-0000-0000-000000000003', 'sea turtle', 'memory-match/ocean/2.png', 2),
  ('c0000001-0000-0000-0000-000000000003', 'jellyfish', 'memory-match/ocean/3.png', 3),
  ('c0000001-0000-0000-0000-000000000003', 'octopus', 'memory-match/ocean/4.png', 4),
  ('c0000001-0000-0000-0000-000000000003', 'seahorse', 'memory-match/ocean/5.png', 5),
  ('c0000001-0000-0000-0000-000000000003', 'whale shark', 'memory-match/ocean/6.png', 6),
  ('c0000001-0000-0000-0000-000000000003', 'manta ray', 'memory-match/ocean/7.png', 7),
  ('c0000001-0000-0000-0000-000000000003', 'clownfish', 'memory-match/ocean/8.png', 8),
  ('c0000001-0000-0000-0000-000000000003', 'starfish', 'memory-match/ocean/9.png', 9);

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
