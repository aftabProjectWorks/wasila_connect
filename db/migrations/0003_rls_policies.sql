-- db/migrations/0003_rls_policies.sql
-- Row Level Security (RLS) recommended policies for Wasila Connect
-- IMPORTANT: These are examples and templates only. Do NOT enable RLS in production
-- without reviewing each policy and adapting to your deployment and Supabase auth setup.

/*
-- Example: enable RLS on members table
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Policy: allow authenticated users to select their own member row
CREATE POLICY "Members can select their own row" ON members
  FOR SELECT USING (supabase_user_id = auth.uid());

-- Policy: allow authenticated users to update their own profile (limited columns)
CREATE POLICY "Members can update their profile" ON members
  FOR UPDATE USING (supabase_user_id = auth.uid())
  WITH CHECK (supabase_user_id = auth.uid());

-- Example: groups - public read, only admins can create
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Groups public select" ON groups FOR SELECT USING (true);
CREATE POLICY "Groups admin insert" ON groups FOR INSERT WITH CHECK (exists(select 1 from members m where m.supabase_user_id = auth.uid() and m.role = 'admin'));

-- Example: group_members - members can see their own membership
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group members select based on membership" ON group_members FOR SELECT USING (
  (exists(select 1 from members m where m.supabase_user_id = auth.uid() and m.id = group_members.member_id))
);

-- Cards and activities: only group members can view and update
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cards group member select" ON cards FOR SELECT USING (
  exists(select 1 from group_members gm join members m on gm.member_id = m.id where m.supabase_user_id = auth.uid() and gm.group_id = cards.group_id and gm.status = 'active')
);

-- Transactions: payer or payee may view
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Transactions view by participant" ON transactions FOR SELECT USING (
  (payer_member_id = (select id from members where supabase_user_id = auth.uid())) OR (payee_member_id = (select id from members where supabase_user_id = auth.uid()))
);

-- Ledger accounts: owner can view
ALTER TABLE ledger_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ledger account owner view" ON ledger_accounts FOR SELECT USING (
  owner_type = 'member' AND owner_id = (select id from members where supabase_user_id = auth.uid())
);
*/

-- End of RLS policy templates
