-- =============================================================
-- Landing Page + Waitlist — FROM template: templates/utility/landing-waitlist/schema.sql
-- =============================================================

-- Template schema (modified: email → email_hash per spec)
-- Original template has: email text NOT NULL UNIQUE
-- Demo stores SHA-256 hash instead of raw email for privacy
CREATE TABLE signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_signups_hash ON signups(email_hash);

-- =============================================================
-- Demo modifications (per landing-waitlist-spec.md)
-- =============================================================

-- Auto-cleanup: delete hashes older than 24 hours
CREATE OR REPLACE FUNCTION cleanup_signups() RETURNS trigger AS $$
BEGIN
  DELETE FROM signups WHERE created_at < now() - interval '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cleanup_signups
  AFTER INSERT ON signups
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_signups();
