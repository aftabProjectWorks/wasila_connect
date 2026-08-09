-- db/migrations/0002_lead_transitions.sql
-- Adds lead_transitions table required by services/leads.ts

CREATE TABLE IF NOT EXISTS lead_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  from_member_id uuid,
  to_member_id uuid,
  initiated_by text NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  effective_at timestamptz,
  approved boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_lead_transitions_group_id ON lead_transitions(group_id);
CREATE INDEX IF NOT EXISTS idx_lead_transitions_approved ON lead_transitions(approved);
