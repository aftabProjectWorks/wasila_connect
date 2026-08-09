/**
 * Wasila Connect - Type Definitions
 * Core domain models for the entire application
 */

// ============================================================================
// MEMBERS
// ============================================================================

export type MemberRole = 'member' | 'admin';
export type MemberStatus = 'active' | 'inactive' | 'suspended';

export interface Member {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  supabase_user_id?: string;
  role: MemberRole;
  status: MemberStatus;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MemberProfile {
  id: string;
  member_id: string;
  group_id: string;
  rating_avg: number;
  activity_score: number;
  cards_issued: number;
  cards_completed: number;
  cards_quit: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// GROUPS
// ============================================================================

export type GroupStatus = 'active' | 'inactive';
export type GroupMemberRole = 'member' | 'lead';
export type GroupMemberStatus = 'active' | 'inactive' | 'left';

export interface Group {
  id: string;
  name: string;
  slug: string;
  description?: string;
  config: Record<string, any>;
  status: GroupStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  member_id: string;
  role: GroupMemberRole;
  status: GroupMemberStatus;
  joined_at: string;
  left_at?: string;
}

export interface LeadTransition {
  id: string;
  group_id: string;
  from_member_id?: string;
  to_member_id?: string;
  initiated_by: 'member' | 'admin' | 'system';
  reason?: string;
  created_at: string;
  effective_at?: string;
  approved: boolean;
}

// ============================================================================
// ASSOCIATIONS & OTP FLOW
// ============================================================================

export type AssociationStatus = 'pending' | 'completed' | 'cancelled';

export interface Association {
  id: string;
  group_id: string;
  inviter_member_id: string;
  status: AssociationStatus;
  otp: string;
  otp_expires_at: string;
  associated_at?: string;
  metadata: Record<string, any>;
  created_at: string;
}

// ============================================================================
// POLICIES
// ============================================================================

export type PolicyScope = 'system' | 'group';

export interface Policy {
  id: string;
  scope: PolicyScope;
  scope_id?: string;
  key: string;
  value: Record<string, any>;
  effective_from: string;
  effective_to?: string;
  created_by?: string;
  created_at: string;
}

export interface PolicyDefaults {
  card_validity_days: number;
  card_max_per_member: number;
  card_daily_limit_sticks: number;
  buffer_threshold_percent: number; // When to show orange state
  red_threshold_percent: number; // When to show red state
  risk_calculation_method: 'linear' | 'exponential'; // How to calculate sticks used vs allotted
}

// ============================================================================
// CARDS & TEMPLATES
// ============================================================================

export type CardStatus = 'active' | 'expired' | 'cancelled' | 'completed' | 'quit';
export type RiskState = 'green' | 'orange' | 'red';

export interface CardTemplate {
  id: string;
  name: string;
  description?: string;
  config: Record<string, any>;
  stick_formula?: string;
  stick_unit: string; // 'piece', 'kg', 'liter', etc.
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  template_id: string;
  group_id: string;
  issued_to: string;
  issued_at: string;
  status: CardStatus;
  validity_days?: number;
  expires_at?: string;
  sticks_allotted: number;
  sticks_used: number;
  risk_state: RiskState;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ACTIVITIES & RATINGS
// ============================================================================

export type ActivityType = 'delivery' | 'return' | 'partial_return' | 'damage' | 'other';

export interface Activity {
  id: string;
  member_id: string;
  group_id: string;
  card_id?: string;
  type: ActivityType;
  quantity: number;
  points: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Rating {
  id: string;
  rater_member_id: string;
  rated_member_id: string;
  activity_id: string;
  group_id: string;
  rating: number; // 0-5
  comment?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// FINANCIAL SYSTEM
// ============================================================================

export type LedgerAccountOwnerType = 'member' | 'group' | 'system';
export type LedgerEntryKind = 'credit' | 'debit';
export type TransactionStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';
export type PaymentType = 'direct' | 'card_completion' | 'refund';
export type PaymentProvider = 'razorpay' | 'mock' | 'internal';

export interface LedgerAccount {
  id: string;
  owner_type: LedgerAccountOwnerType;
  owner_id?: string;
  currency: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface LedgerEntry {
  id: string;
  account_id: string;
  kind: LedgerEntryKind;
  amount: number;
  currency: string;
  source: string;
  reference_id?: string;
  reference_type?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Transaction {
  id: string;
  reference?: string;
  status: TransactionStatus;
  amount: number;
  currency: string;
  payment_type: PaymentType;
  payer_member_id?: string;
  payee_member_id?: string;
  provider?: PaymentProvider;
  provider_reference?: string;
  card_id?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// AUDIT
// ============================================================================

export type AuditActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'payment'
  | 'card_issue'
  | 'card_complete'
  | 'card_quit'
  | 'lead_transition'
  | 'policy_change'
  | 'other';

export type AuditResourceType =
  | 'member'
  | 'group'
  | 'card'
  | 'transaction'
  | 'policy'
  | 'rating'
  | 'activity'
  | 'other';

export interface AuditLog {
  id: string;
  actor_member_id?: string;
  action_type: AuditActionType;
  resource_type?: AuditResourceType;
  resource_id?: string;
  before_state?: Record<string, any>;
  after_state?: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
}

export interface Session {
  user: AuthUser;
  session?: any;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}
