-- 001_init.sql
-- Initial schema for Wasila Connect (Postgres / Supabase)

-- Enable extensions commonly available in Supabase
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Members table (users)
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  supabase_user_id text UNIQUE,
  role text NOT NULL DEFAULT 'member', -- member | admin
  status text NOT NULL DEFAULT 'active',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Groups
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  config jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Group membership association
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member', -- member | lead
  joined_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active'
);

-- Lead transitions (audit of leadership changes)
CREATE TABLE IF NOT EXISTS lead_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  from_member_id uuid NULL REFERENCES members(id),
  to_member_id uuid NULL REFERENCES members(id),
  initiated_by text NOT NULL DEFAULT 'system', -- member | admin | system
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  effective_at timestamptz NULL,
  approved boolean DEFAULT false
);

-- Policies (configurable)
CREATE TABLE IF NOT EXISTS policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL DEFAULT 'system', -- system | group
  scope_id uuid NULL,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz NULL,
  created_by uuid NULL REFERENCES members(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Card templates
CREATE TABLE IF NOT EXISTS card_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  stick_formula text NULL,
  created_by uuid NULL REFERENCES members(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Cards
CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES card_templates(id) ON DELETE SET NULL,
  group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
  issued_to uuid REFERENCES members(id) ON DELETE SET NULL,
  issued_at timestamptz NULL,
  status text NOT NULL DEFAULT 'issued',
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Activities and ratings
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
  type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  points numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  rated_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  rating numeric NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Financial ledger
CREATE TABLE IF NOT EXISTS ledger_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type text NOT NULL, -- member | group | system
  owner_id uuid NULL,
  currency text NOT NULL DEFAULT 'INR',
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES ledger_accounts(id) ON DELETE CASCADE,
  kind text NOT NULL, -- credit | debit
  amount numeric NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'INR',
  source text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE,
  status text NOT NULL DEFAULT 'pending', -- pending | succeeded | failed
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  provider text NULL,
  provider_reference text NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_member_id uuid NULL REFERENCES members(id),
  action_type text NOT NULL,
  resource_type text NULL,
  resource_id uuid NULL,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Basic RLS guidance: enable RLS intentionally after reviewing policies
-- Example (commented):
-- ALTER TABLE members ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "members_self_access" ON members FOR SELECT USING (supabase_user_id = auth.uid());

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_members_email ON members (email);
CREATE INDEX IF NOT EXISTS idx_groups_slug ON groups (slug);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_account ON ledger_entries (account_id);
