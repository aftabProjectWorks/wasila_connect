-- 003_otps.sql
-- Table for one-time tokens / IDs used in chain operations
CREATE TABLE IF NOT EXISTS otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  purpose text NOT NULL,
  issued_to uuid NULL REFERENCES members(id) ON DELETE SET NULL,
  issued_by uuid NULL REFERENCES members(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otps_code ON otps (code);
