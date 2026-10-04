export type CommitmentStatus = 'pending' | 'completed' | 'cancelled';

export type CommitmentCategory =
  | 'family'
  | 'friendship'
  | 'study'
  | 'errands'
  | 'health'
  | 'work'
  | 'other';

export type DatePrecision =
  | 'exact_time'
  | 'day'
  | 'approximate_period'
  | 'unresolved';

export interface User {
  id: string;
  email: string;
  display_name: string;
  timezone: string;
  preferred_reminder_lead_minutes: number;
  default_reminder_time: string; // e.g. "09:00"
  ai_provider: 'ollama' | 'remote' | 'demo';
  created_at: string;
}

export interface Person {
  id: string;
  user_id: string;
  name: string;
  relationship?: string;
  avatar_color?: string;
  commitment_count?: number;
  upcoming_count?: number;
  completed_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Commitment {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  person_id?: string;
  person_name_snapshot?: string;
  category: CommitmentCategory;
  status: CommitmentStatus;
  due_at?: string; // ISO 8601
  timezone: string;
  date_precision: DatePrecision;
  recurrence_rule?: string; // e.g. "FREQ=WEEKLY;BYDAY=TU"
  reminder_enabled: boolean;
  reminder_at?: string; // ISO 8601
  source_type: 'typed_text' | 'voice' | 'assistant';
  source_text?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  completed_note?: string;
  metadata?: Record<string, any>;
}

export interface CommitmentProposal {
  proposal_id: string;
  title: string;
  description?: string;
  person_name?: string;
  person_id?: string;
  category: CommitmentCategory;
  proposed_date?: string; // YYYY-MM-DD
  proposed_time?: string; // HH:mm or "evening", "afternoon", "morning"
  date_precision: DatePrecision;
  timezone: string;
  recurrence_rule?: string;
  reminder_enabled: boolean;
  reminder_at?: string;
  ambiguity_note?: string;
  is_ambiguous: boolean;
  status: 'draft' | 'confirmed' | 'rejected';
}

export interface GroundedCitation {
  id: string;
  title: string;
  person_name_snapshot?: string;
  due_at?: string;
  status: CommitmentStatus;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  proposals?: CommitmentProposal[];
  citations?: GroundedCitation[];
  audio_url?: string;
  is_error?: boolean;
}

export interface Reminder {
  id: string;
  user_id: string;
  commitment_id: string;
  scheduled_at: string;
  status: 'scheduled' | 'delivered' | 'cancelled' | 'failed';
  attempt_count: number;
  last_attempt_at?: string;
  delivered_at?: string;
  created_at: string;
}

export interface InAppNotification {
  id: string;
  user_id: string;
  commitment_id?: string;
  type: 'due_soon' | 'due_today' | 'overdue' | 'reminder' | 'system';
  title: string;
  body: string;
  read_at?: string;
  created_at: string;
}

export interface DashboardSummary {
  due_today_count: number;
  upcoming_count: number;
  completed_this_week_count: number;
  overdue_count: number;
  todays_promises: Commitment[];
  coming_up: Commitment[];
  people: Person[];
  ai_insight: string;
}

export interface IntegrationHealth {
  ollama_connected: boolean;
  ollama_model?: string;
  mongodb_connected: boolean;
  mongodb_database?: string;
  temporal_connected: boolean;
  temporal_task_queue?: string;
  elevenlabs_configured: boolean;
  render_ready: boolean;
  mode: 'production' | 'demo' | 'local';
}
