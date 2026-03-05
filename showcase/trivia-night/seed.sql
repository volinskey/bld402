-- Trivia Night — Seed Data (3 demo rooms with 10 questions each)

-- Room 1: General Knowledge (DEMO1)
INSERT INTO rooms (id, code, host_name, status) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'DEMO1', 'Trivia Bot', 'lobby');

INSERT INTO questions (room_id, question_text, options, correct_index, time_limit, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'What is the largest planet in our solar system?', '["Mars", "Jupiter", "Saturn", "Neptune"]', 1, 20, 0),
  ('a0000000-0000-0000-0000-000000000001', 'How many continents are there on Earth?', '["5", "6", "7", "8"]', 2, 20, 1),
  ('a0000000-0000-0000-0000-000000000001', 'What element does "O" represent on the periodic table?', '["Gold", "Osmium", "Oxygen", "Oganesson"]', 2, 20, 2),
  ('a0000000-0000-0000-0000-000000000001', 'Which country has the longest coastline in the world?', '["Australia", "Russia", "Canada", "Indonesia"]', 2, 20, 3),
  ('a0000000-0000-0000-0000-000000000001', 'What year did the Berlin Wall fall?', '["1987", "1988", "1989", "1991"]', 2, 20, 4),
  ('a0000000-0000-0000-0000-000000000001', 'How many bones are in the adult human body?', '["186", "196", "206", "216"]', 2, 20, 5),
  ('a0000000-0000-0000-0000-000000000001', 'What is the capital of Australia?', '["Sydney", "Melbourne", "Canberra", "Brisbane"]', 2, 20, 6),
  ('a0000000-0000-0000-0000-000000000001', 'Which planet is known as the Red Planet?', '["Venus", "Mars", "Jupiter", "Mercury"]', 1, 20, 7),
  ('a0000000-0000-0000-0000-000000000001', 'What is the speed of light approximately?', '["300,000 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"]', 0, 20, 8),
  ('a0000000-0000-0000-0000-000000000001', 'Which ocean is the largest?', '["Atlantic", "Indian", "Arctic", "Pacific"]', 3, 20, 9);

-- Room 2: Movies & TV (DEMO2)
INSERT INTO rooms (id, code, host_name, status) VALUES
  ('a0000000-0000-0000-0000-000000000002', 'DEMO2', 'Trivia Bot', 'lobby');

INSERT INTO questions (room_id, question_text, options, correct_index, time_limit, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000002', 'Which movie features the quote "Here''s looking at you, kid"?', '["Gone with the Wind", "Casablanca", "The Maltese Falcon", "Citizen Kane"]', 1, 20, 0),
  ('a0000000-0000-0000-0000-000000000002', 'What is the name of the fictional continent in Game of Thrones?', '["Westeros", "Essos", "Middle-earth", "Narnia"]', 0, 20, 1),
  ('a0000000-0000-0000-0000-000000000002', 'Who directed Jurassic Park?', '["James Cameron", "Ridley Scott", "Steven Spielberg", "George Lucas"]', 2, 20, 2),
  ('a0000000-0000-0000-0000-000000000002', 'In The Office (US), what is the name of the paper company?', '["Dunder Mifflin", "Dundee Paper", "Scranton Supply", "Michael Scott Paper"]', 0, 20, 3),
  ('a0000000-0000-0000-0000-000000000002', 'Which actor played Jack Dawson in Titanic?', '["Brad Pitt", "Matt Damon", "Leonardo DiCaprio", "Johnny Depp"]', 2, 20, 4),
  ('a0000000-0000-0000-0000-000000000002', 'What animated movie features a clownfish named Nemo?', '["Shark Tale", "Finding Nemo", "The Little Mermaid", "Moana"]', 1, 20, 5),
  ('a0000000-0000-0000-0000-000000000002', 'In Breaking Bad, what is Walter White''s alias?', '["Heisenberg", "The Cook", "Mr. White", "Blue Sky"]', 0, 20, 6),
  ('a0000000-0000-0000-0000-000000000002', 'Which franchise includes the characters Thor and Iron Man?', '["DC Extended Universe", "Marvel Cinematic Universe", "Star Wars", "X-Men"]', 1, 20, 7),
  ('a0000000-0000-0000-0000-000000000002', 'What year was the first Star Wars movie released?', '["1975", "1977", "1979", "1980"]', 1, 20, 8),
  ('a0000000-0000-0000-0000-000000000002', 'Who plays Eleven in Stranger Things?', '["Sadie Sink", "Millie Bobby Brown", "Natalia Dyer", "Maya Hawke"]', 1, 20, 9);

-- Room 3: Food & Drink (DEMO3)
INSERT INTO rooms (id, code, host_name, status) VALUES
  ('a0000000-0000-0000-0000-000000000003', 'DEMO3', 'Trivia Bot', 'lobby');

INSERT INTO questions (room_id, question_text, options, correct_index, time_limit, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000003', 'What country is the origin of sushi?', '["China", "Korea", "Japan", "Thailand"]', 2, 20, 0),
  ('a0000000-0000-0000-0000-000000000003', 'Which fruit is known as the "king of fruits"?', '["Mango", "Durian", "Jackfruit", "Pineapple"]', 1, 20, 1),
  ('a0000000-0000-0000-0000-000000000003', 'What is the main ingredient in hummus?', '["Lentils", "Black beans", "Chickpeas", "Peas"]', 2, 20, 2),
  ('a0000000-0000-0000-0000-000000000003', 'Which country produces the most coffee in the world?', '["Colombia", "Vietnam", "Ethiopia", "Brazil"]', 3, 20, 3),
  ('a0000000-0000-0000-0000-000000000003', 'What type of pasta is shaped like little ears?', '["Farfalle", "Orecchiette", "Penne", "Rigatoni"]', 1, 20, 4),
  ('a0000000-0000-0000-0000-000000000003', 'Scoville units measure the heat of what?', '["Ovens", "Chili peppers", "Coffee", "Mustard"]', 1, 20, 5),
  ('a0000000-0000-0000-0000-000000000003', 'What is the most consumed beverage in the world after water?', '["Coffee", "Tea", "Beer", "Milk"]', 1, 20, 6),
  ('a0000000-0000-0000-0000-000000000003', 'Which nut is used to make marzipan?', '["Cashew", "Walnut", "Pistachio", "Almond"]', 3, 20, 7),
  ('a0000000-0000-0000-0000-000000000003', 'What cheese is traditionally used on a Margherita pizza?', '["Cheddar", "Parmesan", "Mozzarella", "Gouda"]', 2, 20, 8),
  ('a0000000-0000-0000-0000-000000000003', 'Which spice comes from the Crocus sativus flower?', '["Turmeric", "Paprika", "Saffron", "Cinnamon"]', 2, 20, 9);
