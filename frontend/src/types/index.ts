export type DocumentClass = 'Invoice' | 'Receipt' | 'Contract' | 'Resume' | 'IdentityProof';

export type DocumentStatus = 'processing' | 'needs_review' | 'verified' | 'failed';

export interface ExtractionField {
  id?: string;
  document_id?: string;
  field_key: string;
  field_value: string | null;
  confidence: number;
  is_flagged: boolean;
  human_corrected: boolean;
  created_at?: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface DocumentExtraction {
  document_class: DocumentClass;
  overall_confidence: number;
  summary?: string;
  line_items: LineItem[];
}

export interface AuditLog {
  id: string;
  action: string;
  created_at: string;
  details?: Record<string, any>;
}

export interface DocumentRecord {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size_bytes: number;
  document_class: DocumentClass | null;
  status: DocumentStatus;
  overall_confidence: number | null;
  notes?: string;
  created_at: string;
  updated_at: string;
  extraction?: DocumentExtraction | null;
  fields?: ExtractionField[];
  audit_logs?: AuditLog[];
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
}

export interface AnalyticsOverview {
  total_documents: number;
  needs_review: number;
  verified: number;
  processing: number;
  failed: number;
  average_confidence: number;
  automation_rate: number;
}

export interface AnalyticsData {
  overview: AnalyticsOverview;
  distribution_by_class: Record<string, number>;
  recent_activity: AuditLog[];
}
