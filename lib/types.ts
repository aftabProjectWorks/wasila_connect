/**
 * Common type definitions for the application
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  email?: string;
  full_name?: string;
  user_metadata?: Record<string, any>;
}

export interface Member {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: 'admin' | 'member';
  status: 'active' | 'inactive' | 'suspended';
  supabase_user_id?: string;
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
  created_at: string;
  updated_at: string;
}

export interface LeadTransition {
  id: string;
  group_id: string;
  from_member_id?: string;
  to_member_id: string;
  initiated_by: 'member' | 'admin' | 'system';
  reason?: string;
  approved: boolean;
  effective_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  before_state?: Record<string, any>;
  after_state?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
}
