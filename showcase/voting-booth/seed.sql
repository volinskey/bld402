-- Voting Booth — Seed Data (pizza topping demo poll with 28 votes)

-- Demo poll
INSERT INTO polls (id, title, description, created_by) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'What''s the best pizza topping?',
   'The eternal debate, settled by popular vote.',
   'bld402 Demo');

-- 5 options
INSERT INTO options (id, poll_id, label, sort_order) VALUES
  ('11111111-aaaa-bbbb-cccc-100000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Pepperoni', 0),
  ('11111111-aaaa-bbbb-cccc-100000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Mushrooms', 1),
  ('11111111-aaaa-bbbb-cccc-100000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Pineapple', 2),
  ('11111111-aaaa-bbbb-cccc-100000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Extra Cheese', 3),
  ('11111111-aaaa-bbbb-cccc-100000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Olives', 4);

-- 28 seed votes: Pepperoni 9, Mushrooms 6, Pineapple 5, Extra Cheese 5, Olives 3

-- Pepperoni: 9 votes
INSERT INTO votes (poll_id, option_id, voter_id) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000001', 'seed-voter-01'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000001', 'seed-voter-02'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000001', 'seed-voter-03'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000001', 'seed-voter-04'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000001', 'seed-voter-05'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000001', 'seed-voter-06'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000001', 'seed-voter-07'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000001', 'seed-voter-08'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000001', 'seed-voter-09');

-- Mushrooms: 6 votes
INSERT INTO votes (poll_id, option_id, voter_id) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000002', 'seed-voter-10'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000002', 'seed-voter-11'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000002', 'seed-voter-12'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000002', 'seed-voter-13'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000002', 'seed-voter-14'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000002', 'seed-voter-15');

-- Pineapple: 5 votes
INSERT INTO votes (poll_id, option_id, voter_id) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000003', 'seed-voter-16'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000003', 'seed-voter-17'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000003', 'seed-voter-18'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000003', 'seed-voter-19'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000003', 'seed-voter-20');

-- Extra Cheese: 5 votes
INSERT INTO votes (poll_id, option_id, voter_id) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000004', 'seed-voter-21'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000004', 'seed-voter-22'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000004', 'seed-voter-23'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000004', 'seed-voter-24'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000004', 'seed-voter-25');

-- Olives: 3 votes
INSERT INTO votes (poll_id, option_id, voter_id) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000005', 'seed-voter-26'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000005', 'seed-voter-27'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-aaaa-bbbb-cccc-100000000005', 'seed-voter-28');
