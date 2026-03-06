-- Seed data — these posts persist forever (is_seed = true)
INSERT INTO posts (body, author_name, image_path, likes, is_seed, user_id) VALUES
  ('First day at the new office!', 'Maya', NULL, 12, true, '00000000-0000-0000-0000-000000000000'),
  ('My sourdough starter is finally alive', 'Leo', NULL, 8, true, '00000000-0000-0000-0000-000000000000'),
  ('Hot take: tabs > spaces', 'Dev Diana', NULL, 24, true, '00000000-0000-0000-0000-000000000000'),
  ('Just saw the most adorable dog', 'Sam', 'seed-dog.jpg', 31, true, '00000000-0000-0000-0000-000000000000'),
  ('Today''s sunset was unreal', 'Ava', 'seed-sunset.jpg', 19, true, '00000000-0000-0000-0000-000000000000'),
  ('Coffee > everything', 'Jordan', NULL, 15, true, '00000000-0000-0000-0000-000000000000'),
  ('Tried a new ramen place downtown', 'Kai', 'seed-ramen.jpg', 22, true, '00000000-0000-0000-0000-000000000000'),
  ('Debugging at 2am hits different', 'Noor', NULL, 17, true, '00000000-0000-0000-0000-000000000000');
