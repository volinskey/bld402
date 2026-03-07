-- Seed data for Landing Page + Waitlist showcase
-- Inserts 15 fake signups so a new visitor sees position > 15
-- Note: the cleanup_signups() trigger auto-deletes rows older than 24h.
-- Re-run this seed if signups need replenishing.

INSERT INTO signups (email_hash) VALUES
  ('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2'),
  ('b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b201'),
  ('c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b20102'),
  ('d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2010203'),
  ('e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b201020304'),
  ('f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b20102030405'),
  ('a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2010203040506'),
  ('b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b201020304050607'),
  ('c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b20102030405060708'),
  ('d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2010203040506070809'),
  ('e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b201020304050607080910'),
  ('f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b20102030405060708091011'),
  ('a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2010203040506070809101112'),
  ('b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b201020304050607080910111213'),
  ('c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b20102030405060708091011121314')
ON CONFLICT (email_hash) DO NOTHING;
