-- =============================================================
-- Secret Santa — FROM template: templates/utility/secret-santa/schema.sql
-- =============================================================

-- Template schema (unmodified)
CREATE TABLE groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  budget text,
  organizer_id uuid,
  status text DEFAULT 'open' CHECK (status IN ('open', 'drawn')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid,
  display_name text NOT NULL,
  wishlist text,
  assigned_to uuid,
  viewed_assignment boolean DEFAULT false,
  joined_at timestamptz DEFAULT now()
);

CREATE INDEX idx_members_group ON members(group_id);
CREATE INDEX idx_groups_code ON groups(code);

-- =============================================================
-- Demo modifications (per secret-santa-spec.md)
-- =============================================================

-- Add is_seed column on both tables for seed data protection
ALTER TABLE groups ADD COLUMN is_seed boolean DEFAULT false;
ALTER TABLE members ADD COLUMN is_seed boolean DEFAULT false;
