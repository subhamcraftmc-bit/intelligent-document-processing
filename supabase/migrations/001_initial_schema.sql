-- ==============================================================================
-- 001_initial_schema.sql
-- Intelligent Document Processing (IDP) System
-- Supabase Cloud PostgreSQL Migration: Schema, RLS Policies & Initial Seed Data
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS & PROFILES TABLE
-- Maps 1:1 with Supabase Auth auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'analyst',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to automatically populate public.profiles on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  storage_path TEXT,
  file_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  document_class TEXT, -- 'Invoice', 'Receipt', 'Contract', 'Resume', 'IdentityProof'
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'needs_review', 'verified', 'failed')),
  overall_confidence DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_document_class ON public.documents(document_class);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);

-- 4. DOCUMENT EXTRACTIONS (RAW JSON & TABULAR DATA)
CREATE TABLE IF NOT EXISTS public.document_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL UNIQUE,
  extracted_data JSONB NOT NULL,
  raw_ai_response JSONB,
  model_used TEXT DEFAULT 'gemini-2.0-flash',
  prompt_tokens INT,
  completion_tokens INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_extractions_document_id ON public.document_extractions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_extractions_data ON public.document_extractions USING GIN (extracted_data);

-- 5. EXTRACTION FIELDS (GRANULAR ENTITIES FOR AUDIT & HITL REVIEW)
CREATE TABLE IF NOT EXISTS public.extraction_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  field_key TEXT NOT NULL,
  field_value TEXT,
  confidence DECIMAL(5,2),
  is_flagged BOOLEAN DEFAULT FALSE,
  human_corrected BOOLEAN DEFAULT FALSE,
  previous_value TEXT,
  corrected_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_extraction_fields_document_id ON public.extraction_fields(document_id);
CREATE INDEX IF NOT EXISTS idx_extraction_fields_key ON public.extraction_fields(field_key);
CREATE INDEX IF NOT EXISTS idx_extraction_fields_flagged ON public.extraction_fields(is_flagged);

-- 6. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'DOCUMENT_UPLOADED', 'AI_PROCESSED', 'FIELD_CORRECTED', 'DOCUMENT_VERIFIED', 'DATA_EXPORTED'
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON public.audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) & ACCESS CONTROL POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extraction_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running migration
DO $$ 
BEGIN
  -- Profiles
  DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
  
  -- Documents
  DROP POLICY IF EXISTS "Users can only view their own documents" ON public.documents;
  DROP POLICY IF EXISTS "Users can only insert their own documents" ON public.documents;
  DROP POLICY IF EXISTS "Users can only update their own documents" ON public.documents;
  DROP POLICY IF EXISTS "Users can only delete their own documents" ON public.documents;

  -- Document Extractions
  DROP POLICY IF EXISTS "Users can view extractions of their own documents" ON public.document_extractions;
  DROP POLICY IF EXISTS "Users can insert extractions for their own documents" ON public.document_extractions;
  DROP POLICY IF EXISTS "Users can update extractions for their own documents" ON public.document_extractions;
  DROP POLICY IF EXISTS "Users can delete extractions for their own documents" ON public.document_extractions;

  -- Extraction Fields
  DROP POLICY IF EXISTS "Users can view fields of their own documents" ON public.extraction_fields;
  DROP POLICY IF EXISTS "Users can insert fields for their own documents" ON public.extraction_fields;
  DROP POLICY IF EXISTS "Users can update fields for their own documents" ON public.extraction_fields;
  DROP POLICY IF EXISTS "Users can delete fields for their own documents" ON public.extraction_fields;

  -- Audit Logs
  DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
  DROP POLICY IF EXISTS "Users can insert audit logs" ON public.audit_logs;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Profiles Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Documents Policies
CREATE POLICY "Users can only view their own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

-- Document Extractions Policies (Joined via document_id)
CREATE POLICY "Users can view extractions of their own documents"
  ON public.document_extractions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE public.documents.id = public.document_extractions.document_id
      AND public.documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert extractions for their own documents"
  ON public.document_extractions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE public.documents.id = public.document_extractions.document_id
      AND public.documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update extractions for their own documents"
  ON public.document_extractions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE public.documents.id = public.document_extractions.document_id
      AND public.documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete extractions for their own documents"
  ON public.document_extractions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE public.documents.id = public.document_extractions.document_id
      AND public.documents.user_id = auth.uid()
    )
  );

-- Extraction Fields Policies
CREATE POLICY "Users can view fields of their own documents"
  ON public.extraction_fields FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE public.documents.id = public.extraction_fields.document_id
      AND public.documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert fields for their own documents"
  ON public.extraction_fields FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE public.documents.id = public.extraction_fields.document_id
      AND public.documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update fields for their own documents"
  ON public.extraction_fields FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE public.documents.id = public.extraction_fields.document_id
      AND public.documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete fields for their own documents"
  ON public.extraction_fields FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE public.documents.id = public.extraction_fields.document_id
      AND public.documents.user_id = auth.uid()
    )
  );

-- Audit Logs Policies
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 8. STORAGE BUCKET CONFIGURATION & POLICIES
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can upload their own document files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can read their own document files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own document files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own document files" ON storage.objects;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

CREATE POLICY "Users can upload their own document files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read their own document files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own document files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own document files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ==============================================================================
-- 9. INITIAL SEED DATA
-- ==============================================================================

-- Seed Demo User in auth.users if not present
DO $$
DECLARE
  demo_user_id UUID := 'a0000000-0000-0000-0000-000000000001';
  doc1_id UUID := 'b1111111-1111-1111-1111-111111111111';
  doc2_id UUID := 'b2222222-2222-2222-2222-222222222222';
  doc3_id UUID := 'b3333333-3333-3333-3333-333333333333';
BEGIN
  -- Insert into auth.users safely
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = demo_user_id) THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      demo_user_id,
      'authenticated',
      'authenticated',
      'demo.analyst@cineforge.ai',
      crypt('demoPassword123', gen_salt('bf')),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Alex Mercer (Lead IDP Analyst)"}',
      NOW(),
      NOW()
    );
  END IF;

  -- Ensure Profile Exists
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (demo_user_id, 'demo.analyst@cineforge.ai', 'Alex Mercer (Lead IDP Analyst)', 'admin')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  -- 1. Seed Document: Invoice (Status: needs_review with flagged payment_terms)
  INSERT INTO public.documents (
    id, user_id, file_name, file_url, storage_path, file_type, file_size_bytes, document_class, status, overall_confidence
  ) VALUES (
    doc1_id,
    demo_user_id,
    'Apex_Cloud_INV-2026-8841.pdf',
    'https://images.unsplash.com/photo-1554415707-9e4c09d48d53?auto=format&fit=crop&w=1200&q=80',
    'demo/invoice_sample.pdf',
    'application/pdf',
    342190,
    'Invoice',
    'needs_review',
    0.88
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.document_extractions (
    document_id, extracted_data, model_used
  ) VALUES (
    doc1_id,
    '{
      "document_class": "Invoice",
      "overall_confidence": 0.88,
      "summary": "Commercial cloud engineering services invoice from Apex Cloud Solutions LLC.",
      "line_items": [
        { "description": "Cloud Infrastructure Engineering & Migration", "quantity": 20, "unit_price": 150.00, "total": 3000.00 },
        { "description": "Enterprise Gemini Vision Model Integration", "quantity": 1, "unit_price": 1000.00, "total": 1000.00 },
        { "description": "Premium 24/7 SLA Maintenance & Monitoring", "quantity": 1, "unit_price": 250.00, "total": 250.00 }
      ]
    }'::jsonb,
    'gemini-2.0-flash'
  ) ON CONFLICT (document_id) DO NOTHING;

  -- Granular Fields for Doc 1
  DELETE FROM public.extraction_fields WHERE document_id = doc1_id;
  INSERT INTO public.extraction_fields (document_id, field_key, field_value, confidence, is_flagged, human_corrected) VALUES
    (doc1_id, 'vendor_name', 'Apex Cloud Solutions LLC', 0.98, false, false),
    (doc1_id, 'invoice_number', 'INV-2026-8841', 0.96, false, false),
    (doc1_id, 'invoice_date', '2026-09-28', 0.95, false, false),
    (doc1_id, 'due_date', '2026-10-28', 0.92, false, false),
    (doc1_id, 'subtotal_amount', '$4,250.00', 0.94, false, false),
    (doc1_id, 'tax_amount', '$382.50', 0.90, false, false),
    (doc1_id, 'total_amount', '$4,632.50', 0.97, false, false),
    (doc1_id, 'payment_terms', 'Net 30 (Direct Wire)', 0.79, true, false); -- <85% flagged for review!

  -- 2. Seed Document: Receipt (Status: verified)
  INSERT INTO public.documents (
    id, user_id, file_name, file_url, storage_path, file_type, file_size_bytes, document_class, status, overall_confidence
  ) VALUES (
    doc2_id,
    demo_user_id,
    'Starbucks_Receipt_1042.jpg',
    'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?auto=format&fit=crop&w=1200&q=80',
    'demo/receipt_sample.jpg',
    'image/jpeg',
    182400,
    'Receipt',
    'verified',
    0.97
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.document_extractions (
    document_id, extracted_data, model_used
  ) VALUES (
    doc2_id,
    '{
      "document_class": "Receipt",
      "overall_confidence": 0.97,
      "summary": "Retail beverage receipt from Starbucks Store #1042.",
      "line_items": [
        { "description": "Grande Caramel Macchiato", "quantity": 2, "unit_price": 6.25, "total": 12.50 },
        { "description": "Artisan Butter Croissant", "quantity": 1, "unit_price": 4.50, "total": 4.50 }
      ]
    }'::jsonb,
    'gemini-2.0-flash'
  ) ON CONFLICT (document_id) DO NOTHING;

  DELETE FROM public.extraction_fields WHERE document_id = doc2_id;
  INSERT INTO public.extraction_fields (document_id, field_key, field_value, confidence, is_flagged, human_corrected) VALUES
    (doc2_id, 'merchant_name', 'Starbucks Coffee #1042', 0.99, false, false),
    (doc2_id, 'transaction_date', '2026-09-29', 0.96, false, false),
    (doc2_id, 'payment_method', 'Visa ending in 4022', 0.95, false, false),
    (doc2_id, 'subtotal', '$17.00', 0.97, false, false),
    (doc2_id, 'tax_amount', '$1.45', 0.95, false, false),
    (doc2_id, 'total_amount', '$18.45', 0.98, false, false);

  -- 3. Seed Document: Contract (Status: needs_review)
  INSERT INTO public.documents (
    id, user_id, file_name, file_url, storage_path, file_type, file_size_bytes, document_class, status, overall_confidence
  ) VALUES (
    doc3_id,
    demo_user_id,
    'Nexus_MSA_Agreement_2026.pdf',
    'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80',
    'demo/contract_sample.pdf',
    'application/pdf',
    894312,
    'Contract',
    'needs_review',
    0.84
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.document_extractions (
    document_id, extracted_data, model_used
  ) VALUES (
    doc3_id,
    '{
      "document_class": "Contract",
      "overall_confidence": 0.84,
      "summary": "Master Services Agreement & NDA between CineForge AI and Nexus Data.",
      "line_items": []
    }'::jsonb,
    'gemini-2.0-flash'
  ) ON CONFLICT (document_id) DO NOTHING;

  DELETE FROM public.extraction_fields WHERE document_id = doc3_id;
  INSERT INTO public.extraction_fields (document_id, field_key, field_value, confidence, is_flagged, human_corrected) VALUES
    (doc3_id, 'contract_title', 'Master Services Agreement & NDA', 0.96, false, false),
    (doc3_id, 'party_one', 'CineForge AI Corporation', 0.97, false, false),
    (doc3_id, 'party_two', 'Nexus Data Technologies Inc.', 0.95, false, false),
    (doc3_id, 'effective_date', '2026-10-01', 0.94, false, false),
    (doc3_id, 'termination_clause', '30 days written notice for convenience', 0.82, true, false),
    (doc3_id, 'governing_law', 'State of California, USA', 0.91, false, false),
    (doc3_id, 'liability_cap', '12 months cumulative fees paid', 0.77, true, false);

  -- Seed Audit Logs
  DELETE FROM public.audit_logs WHERE user_id = demo_user_id;
  INSERT INTO public.audit_logs (user_id, action, entity_id, details) VALUES
    (demo_user_id, 'DOCUMENT_UPLOADED', doc1_id, '{"file_name": "Apex_Cloud_INV-2026-8841.pdf"}'::jsonb),
    (demo_user_id, 'AI_PROCESSED', doc1_id, '{"document_class": "Invoice", "confidence": 0.88, "flagged_fields": 1}'::jsonb),
    (demo_user_id, 'DOCUMENT_VERIFIED', doc2_id, '{"file_name": "Starbucks_Receipt_1042.jpg", "status": "verified"}'::jsonb);

END $$;
