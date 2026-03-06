-- Seed data — demo decks persist forever (is_seed = true)

-- Seed decks
INSERT INTO decks (id, name, description, user_id, is_public, is_seed) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'World Capitals', 'Match countries to their capital cities', null, true, true),
  ('d0000001-0000-0000-0000-000000000002', 'Spanish Basics', 'Essential Spanish vocabulary for beginners', null, true, true),
  ('d0000001-0000-0000-0000-000000000003', 'Web Dev Terms', 'Key web development concepts explained simply', null, true, true);

-- World Capitals (20 cards)
INSERT INTO cards (deck_id, front, back, sort_order) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'France', 'Paris', 1),
  ('d0000001-0000-0000-0000-000000000001', 'Japan', 'Tokyo', 2),
  ('d0000001-0000-0000-0000-000000000001', 'Brazil', 'Brasilia', 3),
  ('d0000001-0000-0000-0000-000000000001', 'Australia', 'Canberra', 4),
  ('d0000001-0000-0000-0000-000000000001', 'Egypt', 'Cairo', 5),
  ('d0000001-0000-0000-0000-000000000001', 'Canada', 'Ottawa', 6),
  ('d0000001-0000-0000-0000-000000000001', 'Italy', 'Rome', 7),
  ('d0000001-0000-0000-0000-000000000001', 'India', 'New Delhi', 8),
  ('d0000001-0000-0000-0000-000000000001', 'Mexico', 'Mexico City', 9),
  ('d0000001-0000-0000-0000-000000000001', 'Germany', 'Berlin', 10),
  ('d0000001-0000-0000-0000-000000000001', 'South Korea', 'Seoul', 11),
  ('d0000001-0000-0000-0000-000000000001', 'Argentina', 'Buenos Aires', 12),
  ('d0000001-0000-0000-0000-000000000001', 'Thailand', 'Bangkok', 13),
  ('d0000001-0000-0000-0000-000000000001', 'Kenya', 'Nairobi', 14),
  ('d0000001-0000-0000-0000-000000000001', 'Norway', 'Oslo', 15),
  ('d0000001-0000-0000-0000-000000000001', 'Peru', 'Lima', 16),
  ('d0000001-0000-0000-0000-000000000001', 'Turkey', 'Ankara', 17),
  ('d0000001-0000-0000-0000-000000000001', 'Poland', 'Warsaw', 18),
  ('d0000001-0000-0000-0000-000000000001', 'Vietnam', 'Hanoi', 19),
  ('d0000001-0000-0000-0000-000000000001', 'Morocco', 'Rabat', 20);

-- Spanish Basics (15 cards)
INSERT INTO cards (deck_id, front, back, sort_order) VALUES
  ('d0000001-0000-0000-0000-000000000002', 'Hello', 'Hola', 1),
  ('d0000001-0000-0000-0000-000000000002', 'Goodbye', 'Adiós', 2),
  ('d0000001-0000-0000-0000-000000000002', 'Please', 'Por favor', 3),
  ('d0000001-0000-0000-0000-000000000002', 'Thank you', 'Gracias', 4),
  ('d0000001-0000-0000-0000-000000000002', 'Water', 'Agua', 5),
  ('d0000001-0000-0000-0000-000000000002', 'Food', 'Comida', 6),
  ('d0000001-0000-0000-0000-000000000002', 'House', 'Casa', 7),
  ('d0000001-0000-0000-0000-000000000002', 'Dog', 'Perro', 8),
  ('d0000001-0000-0000-0000-000000000002', 'Cat', 'Gato', 9),
  ('d0000001-0000-0000-0000-000000000002', 'Book', 'Libro', 10),
  ('d0000001-0000-0000-0000-000000000002', 'Friend', 'Amigo', 11),
  ('d0000001-0000-0000-0000-000000000002', 'Good morning', 'Buenos días', 12),
  ('d0000001-0000-0000-0000-000000000002', 'How are you?', '¿Cómo estás?', 13),
  ('d0000001-0000-0000-0000-000000000002', 'I love you', 'Te quiero', 14),
  ('d0000001-0000-0000-0000-000000000002', 'Cheers', 'Salud', 15);

-- Web Dev Terms (15 cards)
INSERT INTO cards (deck_id, front, back, sort_order) VALUES
  ('d0000001-0000-0000-0000-000000000003', 'REST API', 'A way for apps to talk over the internet using URLs and HTTP methods', 1),
  ('d0000001-0000-0000-0000-000000000003', 'HTML', 'The language that defines the structure of web pages', 2),
  ('d0000001-0000-0000-0000-000000000003', 'CSS', 'Stylesheet language that controls how web pages look', 3),
  ('d0000001-0000-0000-0000-000000000003', 'JavaScript', 'Programming language that makes web pages interactive', 4),
  ('d0000001-0000-0000-0000-000000000003', 'Database', 'Organized storage for application data', 5),
  ('d0000001-0000-0000-0000-000000000003', 'DNS', 'System that converts domain names to IP addresses', 6),
  ('d0000001-0000-0000-0000-000000000003', 'HTTP', 'Protocol for transferring web pages between servers and browsers', 7),
  ('d0000001-0000-0000-0000-000000000003', 'JSON', 'Lightweight data format using key-value pairs', 8),
  ('d0000001-0000-0000-0000-000000000003', 'Git', 'Version control system that tracks code changes', 9),
  ('d0000001-0000-0000-0000-000000000003', 'Docker', 'Tool that packages apps with their dependencies into containers', 10),
  ('d0000001-0000-0000-0000-000000000003', 'SQL', 'Language for querying and managing databases', 11),
  ('d0000001-0000-0000-0000-000000000003', 'CDN', 'Network of servers that delivers content from locations close to users', 12),
  ('d0000001-0000-0000-0000-000000000003', 'OAuth', 'Standard for letting apps access your data without sharing your password', 13),
  ('d0000001-0000-0000-0000-000000000003', 'WebSocket', 'Two-way communication channel between browser and server', 14),
  ('d0000001-0000-0000-0000-000000000003', 'Responsive Design', 'Approach where layouts adapt to different screen sizes', 15);
