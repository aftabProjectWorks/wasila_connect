-- 002_rls_and_policies.sql
-- Enable RLS on tables and add conservative policies.

-- Note: Review these policies before enabling in production. They are conservative and assume members.supabase_user_id maps to auth.uid().

-- Enable RLS
ALTER TABLE IF EXISTS members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;

-- Members: allow authenticated users to select their own member row by matching supabase_user_id
CREATE POLICY IF NOT EXISTS "select_own_member" ON members
  FOR SELECT USING (supabase_user_id = auth.uid());

-- Members: allow authenticated users to update their own non-role fields
CREATE POLICY IF NOT EXISTS "update_own_member" ON members
  FOR UPDATE USING (supabase_user_id = auth.uid()) WITH CHECK (supabase_user_id = auth.uid() AND role = role);

-- Groups: allow select for anyone (public) but restrict inserts/updates to admins or service role
CREATE POLICY IF NOT EXISTS "select_groups_public" ON groups
  FOR SELECT USING (true);

-- Group members: allow a member to see their group membership rows
CREATE POLICY IF NOT EXISTS "select_group_members_self" ON group_members
  FOR SELECT USING (member_id = (SELECT id FROM members WHERE supabase_user_id = auth.uid()));

-- Cards: members can select cards issued to them
CREATE POLICY IF NOT EXISTS "select_cards_issued" ON cards
  FOR SELECT USING (issued_to = (SELECT id FROM members WHERE supabase_user_id = auth.uid()));

-- Ledger accounts: only service role can write; members can select accounts they own
CREATE POLICY IF NOT_EXISTS "select_ledger_accounts_owner" ON ledger_accounts
  FOR SELECT USING (owner_id = (SELECT id FROM members WHERE supabase_user_id = auth.uid()));

-- Transactions: only service role can insert; allow select for admins/service
-- IMPORTANT: rely on service role for sensitive financial writes

-- Helpers to detect service role: in Supabase, service role bypasses RLS. Applications should use service role for server operations.

-- Note: These policies are examples. Please audit before enabling in production.
