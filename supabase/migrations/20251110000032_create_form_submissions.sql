-- Create form_submissions table
-- This migration creates the form_submissions table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'form_submissions'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.form_submissions (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      form_id uuid NOT NULL,
      submitter_name text,
      submitter_email text,
      responses jsonb DEFAULT '[]'::jsonb NOT NULL,
      comments text,
      status text DEFAULT 'new'::text NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      client_id uuid,
      submitter_phone character varying(50),
      submitter_type character varying(50),
      attachments jsonb,
      acknowledged_by_name text,
      acknowledged_at timestamp with time zone,
      CONSTRAINT form_submissions_pkey PRIMARY KEY (id)
    );

    -- Add foreign key constraints
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'custom_forms') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'form_submissions_form_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'form_submissions'
      ) THEN
        ALTER TABLE public.form_submissions 
        ADD CONSTRAINT form_submissions_form_id_fkey 
        FOREIGN KEY (form_id) REFERENCES public.custom_forms(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'form_submissions_client_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'form_submissions'
      ) THEN
        ALTER TABLE public.form_submissions 
        ADD CONSTRAINT form_submissions_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_form_submissions_form_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_form_submissions_form_id ON public.form_submissions USING btree (form_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_form_submissions_client_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_form_submissions_client_id ON public.form_submissions USING btree (client_id);
    END IF;
  END IF;
END $$;

