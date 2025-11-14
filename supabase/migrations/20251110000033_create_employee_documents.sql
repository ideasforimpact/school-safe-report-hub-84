-- Create employee_documents table
-- This migration creates the employee_documents table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'employee_documents'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.employee_documents (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      employee_id uuid NOT NULL,
      document_url text NOT NULL,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      employee_docs_log jsonb DEFAULT '[]'::jsonb,
      document_type_id uuid,
      document_status_id uuid,
      last_otp_generated timestamp with time zone,
      verification_status text,
      document_number text,
      params jsonb DEFAULT '{}'::jsonb,
      cron_activate boolean DEFAULT false,
      cron_activated_date timestamp with time zone,
      cron_updated_date timestamp with time zone,
      cron_log jsonb DEFAULT '[]'::jsonb,
      api_response_data jsonb,
      api_verification_status text,
      api_verification_date timestamp with time zone,
      api_verification_method text,
      verified_by uuid,
      reject_reason text,
      documents_files jsonb DEFAULT '[]'::jsonb,
      comments jsonb,
      is_delete integer DEFAULT 0,
      CONSTRAINT employee_documents_pkey PRIMARY KEY (id),
      CONSTRAINT check_api_verification_status CHECK (
        (api_verification_status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text])) 
        OR (api_verification_status IS NULL)
      )
    );

    -- Add foreign key constraints
    -- Note: Production does NOT have employee_id FK constraint, only these 3 FKs:
    -- 1. document_type_id -> employee_document_type(id) ON DELETE CASCADE
    -- 2. document_status_id -> document_status(id) ON DELETE CASCADE
    -- 3. verified_by -> employees(id) ON DELETE CASCADE
    
    -- Remove employee_id FK if it exists (production doesn't have it)
    IF EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'employee_documents_employee_id_fkey'
      AND conrelid = 'public.employee_documents'::regclass
    ) THEN
      ALTER TABLE public.employee_documents DROP CONSTRAINT IF EXISTS employee_documents_employee_id_fkey;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employee_document_type') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'employee_documents_document_type_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'employee_documents'
      ) THEN
        ALTER TABLE public.employee_documents 
        ADD CONSTRAINT employee_documents_document_type_id_fkey 
        FOREIGN KEY (document_type_id) REFERENCES public.employee_document_type(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'document_status') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'employee_documents_document_status_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'employee_documents'
      ) THEN
        ALTER TABLE public.employee_documents 
        ADD CONSTRAINT employee_documents_document_status_id_fkey 
        FOREIGN KEY (document_status_id) REFERENCES public.document_status(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'employee_documents_verified_by_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'employee_documents'
      ) THEN
        ALTER TABLE public.employee_documents 
        ADD CONSTRAINT employee_documents_verified_by_fkey 
        FOREIGN KEY (verified_by) REFERENCES public.employees(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_employee_documents_verified_by' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_employee_documents_verified_by ON public.employee_documents USING btree (verified_by);
    END IF;

    -- Add comments
    COMMENT ON COLUMN public.employee_documents.cron_activate IS 'Boolean flag to indicate if cron job is activated for this document';
    COMMENT ON COLUMN public.employee_documents.cron_activated_date IS 'Timestamp when cron job was activated for this document';
    COMMENT ON COLUMN public.employee_documents.cron_updated_date IS 'Timestamp when cron job was last updated for this document';
    COMMENT ON COLUMN public.employee_documents.cron_log IS 'JSON array to store cron job execution logs and history';
    COMMENT ON COLUMN public.employee_documents.api_response_data IS 'Stores the complete API verification response data';
    COMMENT ON COLUMN public.employee_documents.api_verification_status IS 'Status of API verification: pending, completed, failed, or null';
    COMMENT ON COLUMN public.employee_documents.api_verification_date IS 'Timestamp when API verification was performed';
    COMMENT ON COLUMN public.employee_documents.api_verification_method IS 'Method used for API verification: surepass, manual, etc.';
    COMMENT ON COLUMN public.employee_documents.reject_reason IS 'Reason for rejecting the document verification';
  END IF;
END $$;

