-- db/migrations/0001_init.sql
-- Initial schema for Wasila Connect

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- MEMBERS
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  full_name text,
  phone text,
  supabase_user_id text UNIQUE,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'active',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_members_supabase_user_id ON members(supabase_user_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);

-- GROUPS
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  config jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_groups_slug ON groups(slug);

-- GROUP MEMBERS
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'active',
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_group_member_unique ON group_members(group_id, member_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);

-- MEMBER PROFILES
CREATE TABLE IF NOT EXISTS member_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  rating_avg numeric DEFAULT 0,
  activity_score numeric DEFAULT 0,
  cards_issued integer DEFAULT 0,
  cards_completed integer DEFAULT 0,
  cards_quit integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_member_profiles_member_group ON member_profiles(member_id, group_id);

-- ASSOCIATIONS (OTP invites)
CREATE TABLE IF NOT EXISTS associations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  inviter_member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  otp text,
  otp_expires_at timestamptz,
  associated_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- CARD TEMPLATES
CREATE TABLE IF NOT EXISTS card_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  config jsonb DEFAULT '{}'::jsonb,
  stick_formula text,
  stick_unit text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- CARDS
CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES card_templates(id) ON DELETE SET NULL,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  issued_to uuid REFERENCES members(id) ON DELETE SET NULL,
  issued_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  validity_days integer,
  expires_at timestamptz,
  sticks_allotted numeric DEFAULT 0,
  sticks_used numeric DEFAULT 0,
  risk_state text DEFAULT 'green',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cards_group_id ON cards(group_id);

-- ACTIVITIES
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
  card_id uuid REFERENCES cards(id) ON DELETE SET NULL,
  type text NOT NULL,
  quantity numeric DEFAULT 0,
  points numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RATINGS
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  rated_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  activity_id uuid REFERENCES activities(id) ON DELETE SET NULL,
  group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
  rating numeric CHECK (rating >= 0 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- POLICIES
CREATE TABLE IF NOT EXISTS policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  scope_id uuid,
  key text NOT NULL,
  value jsonb DEFAULT '{}'::jsonb,
  effective_from timestamptz DEFAULT now(),
  effective_to timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- LEDGER ACCOUNTS
CREATE TABLE IF NOT EXISTS ledger_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type text NOT NULL,
  owner_id uuid,
  currency text NOT NULL DEFAULT 'INR',
  balance numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_accounts_owner ON ledger_accounts(owner_type, owner_id);

-- LEDGER ENTRIES
CREATE TABLE IF NOT EXISTS ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES ledger_accounts(id) ON DELETE CASCADE,
  kind text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL,
  source text,
  reference_id uuid,
  reference_type text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text,
  status text NOT NULL DEFAULT 'pending',
  amount numeric NOT NULL,
  currency text NOT NULL,
  payment_type text,
  payer_member_id uuid,
  payee_member_id uuid,
  provider text,
  provider_reference text,
  card_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_member_id uuid,
  action_type text NOT NULL,
  resource_type text,
  resource_id uuid,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- INDEXES for common lookups
CREATE INDEX IF NOT EXISTS idx_activities_member ON activities(member_id);
CREATE INDEX IF NOT EXISTS idx_activities_group ON activities(group_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_member ON ratings(rated_member_id);

-- RLS placeholders (do NOT enable RLS without reviewing policies)
-- Example: ALTER TABLE members ENABLE ROW LEVEL SECURITY;
-- Example policy skeleton:
-- CREATE POLICY "Members can view their row" ON members FOR SELECT USING (supabase_user_id = auth.uid());

-- End of migration
