-- Create compliance_documents table
-- This migration creates the compliance_documents table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'compliance_documents'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.compliance_documents (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      client_id uuid NOT NULL,
      folder_exists boolean DEFAULT false NOT NULL,
      folder_id uuid,
      files jsonb DEFAULT '[]'::jsonb NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      created_by uuid,
      parent_folder_id uuid,
      CONSTRAINT compliance_documents_pkey PRIMARY KEY (id)
    );

    -- Add foreign key constraints
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'compliance_documents_client_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'compliance_documents'
      ) THEN
        ALTER TABLE public.compliance_documents 
        ADD CONSTRAINT compliance_documents_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- compliance_documents_created_by_fkey
    -- Production: ON UPDATE CASCADE ON DELETE SET NULL (not CASCADE)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
      -- Drop existing constraint if it has wrong ON DELETE/UPDATE actions
      IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'compliance_documents_created_by_fkey'
        AND conrelid = 'public.compliance_documents'::regclass
        AND (confdeltype != 'n' OR confupdtype != 'c')  -- 'n' = SET NULL, 'c' = CASCADE
      ) THEN
        ALTER TABLE public.compliance_documents DROP CONSTRAINT IF EXISTS compliance_documents_created_by_fkey;
      END IF;
      
      -- Create constraint with correct ON UPDATE/ON DELETE actions
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'compliance_documents_created_by_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'compliance_documents'
      ) THEN
        ALTER TABLE public.compliance_documents 
        ADD CONSTRAINT compliance_documents_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;
      END IF;
    END IF;

    -- compliance_documents_parent_fk (MISSING - Production has this FK)
    -- Production: ON UPDATE CASCADE ON DELETE CASCADE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'compliance_documents') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'compliance_documents_parent_fk' 
        AND table_schema = 'public' 
        AND table_name = 'compliance_documents'
      ) THEN
        ALTER TABLE public.compliance_documents 
        ADD CONSTRAINT compliance_documents_parent_fk 
        FOREIGN KEY (parent_folder_id) REFERENCES public.compliance_documents(id) ON UPDATE CASCADE ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_compliance_documents_client' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_compliance_documents_client ON public.compliance_documents USING btree (client_id);
    END IF;
  END IF;
END $$;

