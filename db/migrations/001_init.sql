-- 001_init.sql
-- Initial schema for Wasila Connect (Postgres / Supabase)
-- Complete schema supporting Members, Groups, Cards, Associations, Ledger, Audit

-- Enable extensions commonly available in Supabase
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- MEMBERS (Users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  supabase_user_id text UNIQUE,
  role text NOT NULL DEFAULT 'member', -- member | admin
  status text NOT NULL DEFAULT 'active', -- active | inactive | suspended
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- GROUPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  config jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active', -- active | inactive
  created_by uuid REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Group membership association
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member', -- member | lead
  status text NOT NULL DEFAULT 'active', -- active | inactive | left
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz NULL,
  UNIQUE(group_id, member_id)
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

-- ============================================================================
-- ASSOCIATION / CHAIN / OTP FLOW
-- ============================================================================

CREATE TABLE IF NOT EXISTS associations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  inviter_member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending', -- pending | completed | cancelled
  otp text NOT NULL, -- Temporary OTP for association
  otp_expires_at timestamptz NOT NULL,
  associated_at timestamptz NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- POLICIES (Configurable, system or group-level)
-- ============================================================================

CREATE TABLE IF NOT EXISTS policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL DEFAULT 'system', -- system | group
  scope_id uuid NULL REFERENCES groups(id) ON DELETE CASCADE,
  key text NOT NULL, -- e.g., card_validity_days, max_cards_per_member, etc.
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz NULL,
  created_by uuid NULL REFERENCES members(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(scope, scope_id, key, effective_from)
);

-- ============================================================================
-- CARD TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS card_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  stick_formula text NULL, -- Formula for calculating sticks/units
  stick_unit text NOT NULL DEFAULT 'piece', -- piece | kg | liter | etc.
  created_by uuid NULL REFERENCES members(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- CARDS (Issued to members within groups)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES card_templates(id) ON DELETE RESTRICT,
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  issued_to uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active', -- active | expired | cancelled | completed | quit
  validity_days integer, -- Days from issuance
  expires_at timestamptz NULL,
  sticks_allotted numeric NOT NULL DEFAULT 0, -- Total units allocated
  sticks_used numeric NOT NULL DEFAULT 0, -- Units consumed
  risk_state text DEFAULT 'green', -- green | orange | red
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- MEMBER PROFILES & RATINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS member_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid UNIQUE NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  rating_avg numeric DEFAULT 0, -- Average rating across activities
  activity_score numeric DEFAULT 0, -- Cumulative activity score
  cards_issued integer DEFAULT 0,
  cards_completed integer DEFAULT 0,
  cards_quit integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id, group_id)
);

-- ============================================================================
-- ACTIVITIES & RATINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  card_id uuid REFERENCES cards(id) ON DELETE SET NULL,
  type text NOT NULL, -- delivery | return | partial_return | etc.
  quantity numeric DEFAULT 0,
  points numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  rated_member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  rating numeric NOT NULL CHECK (rating >= 0 AND rating <= 5), -- 0-5 stars
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- FINANCIAL SYSTEM: LEDGER & TRANSACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ledger_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type text NOT NULL, -- member | group | system
  owner_id uuid NULL, -- REFERENCES members or groups depending on owner_type
  currency text NOT NULL DEFAULT 'INR',
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES ledger_accounts(id) ON DELETE CASCADE,
  kind text NOT NULL, -- credit | debit
  amount numeric NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'INR',
  source text NOT NULL, -- payment | card_completion | refund | adjustment | etc.
  reference_id uuid NULL, -- e.g., transaction_id, card_id
  reference_type text, -- transaction | card | activity
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE,
  status text NOT NULL DEFAULT 'pending', -- pending | succeeded | failed | refunded
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'INR',
  payment_type text NOT NULL DEFAULT 'direct', -- direct | card_completion | refund
  payer_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  payee_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  provider text NULL, -- razorpay | mock | internal
  provider_reference text NULL,
  card_id uuid REFERENCES cards(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- AUDIT LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_member_id uuid NULL REFERENCES members(id) ON DELETE SET NULL,
  action_type text NOT NULL, -- create | update | delete | payment | card_issue | etc.
  resource_type text NULL, -- member | group | card | transaction | policy
  resource_id uuid NULL,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_members_email ON members (email);
CREATE INDEX IF NOT EXISTS idx_members_supabase_user_id ON members (supabase_user_id);
CREATE INDEX IF NOT EXISTS idx_groups_slug ON groups (slug);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_member ON group_members (member_id);
CREATE INDEX IF NOT EXISTS idx_group_members_role ON group_members (group_id, role);
CREATE INDEX IF NOT EXISTS idx_cards_group ON cards (group_id);
CREATE INDEX IF NOT EXISTS idx_cards_member ON cards (issued_to);
CREATE INDEX IF NOT EXISTS idx_cards_status ON cards (status);
CREATE INDEX IF NOT EXISTS idx_cards_expires ON cards (expires_at);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_account ON ledger_entries (account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (status);
CREATE INDEX IF NOT EXISTS idx_transactions_payer ON transactions (payer_member_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payee ON transactions (payee_member_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs (actor_member_id);
CREATE INDEX IF NOT EXISTS idx_activities_member ON activities (member_id);
CREATE INDEX IF NOT EXISTS idx_activities_group ON activities (group_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated ON ratings (rated_member_id);
CREATE INDEX IF NOT EXISTS idx_policies_scope ON policies (scope, scope_id);
CREATE INDEX IF NOT EXISTS idx_associations_group ON associations (group_id);
CREATE INDEX IF NOT EXISTS idx_associations_status ON associations (status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Guidance
-- ============================================================================
-- RLS should be enabled intentionally after reviewing security requirements.
-- Example policies (for reference):
--
-- ALTER TABLE members ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "members_read_self" ON members FOR SELECT USING (supabase_user_id = auth.uid());
-- CREATE POLICY "members_update_self" ON members FOR UPDATE USING (supabase_user_id = auth.uid());
--
-- ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "group_members_read_in_group" ON group_members FOR SELECT
--   USING (EXISTS (SELECT 1 FROM group_members gm2 
--           WHERE gm2.group_id = group_members.group_id 
--           AND gm2.member_id = (SELECT id FROM members WHERE supabase_user_id = auth.uid())));
--
-- See RLS documentation for complete security model.
