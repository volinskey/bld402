-- Seed data — these tasks persist forever (is_seed = true)
INSERT INTO todos (task, assigned_to, is_seed) VALUES
  ('Buy groceries for the team lunch', 'Alex', true),
  ('Review the project proposal', 'Jordan', true),
  ('Set up the demo environment', 'Sam', true);
