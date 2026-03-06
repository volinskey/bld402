-- Seed data — demo game persists forever (is_seed = true)

-- Demo game: Office Bingo (finished state)
INSERT INTO games (id, name, code, host_name, status, is_seed) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'Demo Office Bingo', 'DEMO01', 'DemoHost', 'finished', true);

-- All 30 Office Bingo items, all called
INSERT INTO items (game_id, label, called, call_order) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'Someone''s on mute', true, 1),
  ('b0000001-0000-0000-0000-000000000001', 'Dog in background', true, 2),
  ('b0000001-0000-0000-0000-000000000001', 'Sorry I was on mute', true, 3),
  ('b0000001-0000-0000-0000-000000000001', 'Can you see my screen?', true, 4),
  ('b0000001-0000-0000-0000-000000000001', 'Let''s take this offline', true, 5),
  ('b0000001-0000-0000-0000-000000000001', 'Quick question', true, 6),
  ('b0000001-0000-0000-0000-000000000001', 'You''re on mute', true, 7),
  ('b0000001-0000-0000-0000-000000000001', 'Sorry, go ahead', true, 8),
  ('b0000001-0000-0000-0000-000000000001', 'I''ll follow up on that', true, 9),
  ('b0000001-0000-0000-0000-000000000001', 'Let''s circle back', true, 10),
  ('b0000001-0000-0000-0000-000000000001', 'Synergy', true, 11),
  ('b0000001-0000-0000-0000-000000000001', 'Deep dive', true, 12),
  ('b0000001-0000-0000-0000-000000000001', 'Low-hanging fruit', true, 13),
  ('b0000001-0000-0000-0000-000000000001', 'Move the needle', true, 14),
  ('b0000001-0000-0000-0000-000000000001', 'Action items', true, 15),
  ('b0000001-0000-0000-0000-000000000001', 'Bandwidth', true, 16),
  ('b0000001-0000-0000-0000-000000000001', 'Touch base', true, 17),
  ('b0000001-0000-0000-0000-000000000001', 'Ping me', true, 18),
  ('b0000001-0000-0000-0000-000000000001', 'Loop someone in', true, 19),
  ('b0000001-0000-0000-0000-000000000001', 'EOD', true, 20),
  ('b0000001-0000-0000-0000-000000000001', 'Per my last email', true, 21),
  ('b0000001-0000-0000-0000-000000000001', 'Going forward', true, 22),
  ('b0000001-0000-0000-0000-000000000001', 'Pivot', true, 23),
  ('b0000001-0000-0000-0000-000000000001', 'Drill down', true, 24),
  ('b0000001-0000-0000-0000-000000000001', 'Hard stop', true, 25),
  ('b0000001-0000-0000-0000-000000000001', 'Unpack that', true, 26),
  ('b0000001-0000-0000-0000-000000000001', 'On my radar', true, 27),
  ('b0000001-0000-0000-0000-000000000001', 'Table this', true, 28),
  ('b0000001-0000-0000-0000-000000000001', 'Double-click on that', true, 29),
  ('b0000001-0000-0000-0000-000000000001', 'At the end of the day', true, 30);

-- 3 demo players with randomized cards
INSERT INTO players (game_id, name, card, marked, has_bingo) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'Alice',
    '["Someone''s on mute","Deep dive","Synergy","Quick question","Pivot","Dog in background","Low-hanging fruit","Bandwidth","Ping me","EOD","Let''s circle back","Action items","FREE","Touch base","Going forward","Hard stop","Move the needle","Sorry I was on mute","Loop someone in","Can you see my screen?","Per my last email","Drill down","You''re on mute","Let''s take this offline","Table this"]',
    '[true,true,true,true,true,false,true,false,true,false,true,true,true,true,true,false,true,false,true,false,true,true,true,false,true]',
    true),
  ('b0000001-0000-0000-0000-000000000001', 'Bob',
    '["Bandwidth","Sorry, go ahead","Pivot","You''re on mute","Hard stop","Action items","Let''s circle back","Dog in background","EOD","Synergy","Per my last email","Drill down","FREE","Quick question","Move the needle","Someone''s on mute","Touch base","Loop someone in","Going forward","Deep dive","Can you see my screen?","Ping me","Low-hanging fruit","Table this","Let''s take this offline"]',
    '[true,false,true,true,false,true,false,true,true,false,true,false,true,true,false,true,false,true,false,true,false,true,false,true,false]',
    false),
  ('b0000001-0000-0000-0000-000000000001', 'Charlie',
    '["Let''s take this offline","Synergy","EOD","Touch base","Per my last email","Drill down","Quick question","Move the needle","Action items","Dog in background","Pivot","Sorry I was on mute","FREE","Hard stop","Bandwidth","Going forward","Loop someone in","Deep dive","Someone''s on mute","Low-hanging fruit","Can you see my screen?","You''re on mute","Ping me","Let''s circle back","Sorry, go ahead"]',
    '[false,true,true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false,false,true,false,true,false]',
    false);
