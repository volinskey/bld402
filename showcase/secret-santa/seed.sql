-- Seed data — demo group and members persist forever (is_seed = true)

-- Demo group
INSERT INTO groups (id, name, code, budget, status, is_seed) VALUES
  ('00000000-0000-0000-0000-000000000001', 'bld402 Team Holiday Exchange', 'BLD402DEMO', '$25', 'drawn', true);

-- Demo members (with circular assignment chain)
INSERT INTO members (id, group_id, display_name, wishlist, assigned_to, viewed_assignment, is_seed) VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Alex', 'cozy socks', '00000000-0000-0000-0000-000000000020', true, true),
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'Jordan', 'a good book', '00000000-0000-0000-0000-000000000030', true, true),
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', 'Sam', 'coffee beans', '00000000-0000-0000-0000-000000000040', true, true),
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', 'Riley', 'board game', '00000000-0000-0000-0000-000000000050', true, true),
  ('00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000001', 'Casey', 'plant', '00000000-0000-0000-0000-000000000010', true, true);
