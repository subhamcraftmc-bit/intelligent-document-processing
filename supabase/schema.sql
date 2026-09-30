-- Intelligent Document Processing (IDP) System
-- Complete PostgreSQL Database Schema & RLS Setup for Supabase

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS & PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'analyst',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to automatically create a public.profiles record when a user signs up via Supabase Auth
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
  SET email = EXCLUDED.email;
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

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_document_class ON public.documents(document_class);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);

-- 4. DOCUMENT EXTRACTIONS (RAW JSON DATA & STRUCTURED OUTPUTS)
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

-- 5. GRANULAR EXTRACTION FIELDS (For querying, sorting, auditing, and field-level corrections)
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
  action TEXT NOT NULL, -- e.g., 'DOCUMENT_UPLOADED', 'AI_PROCESSED', 'FIELD_CORRECTED', 'DOCUMENT_VERIFIED', 'DATA_EXPORTED'
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON public.audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extraction_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

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

-- Document Extractions Policies
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

-- 8. STORAGE BUCKET CONFIGURATION (Supabase Storage)
-- Create bucket 'documents' if not present (execute via Supabase dashboard or storage API)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Restrict documents bucket access to authenticated users owning the path
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
