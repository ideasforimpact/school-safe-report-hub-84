-- Create custom_forms table
-- This migration creates the custom_forms table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'custom_forms'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.custom_forms (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      client_id uuid,
      title text NOT NULL,
      description text,
      fields jsonb DEFAULT '[]'::jsonb NOT NULL,
      is_active boolean DEFAULT true NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      created_by uuid,
      excluded_fields jsonb DEFAULT '[]'::jsonb,
      client_logo text,
      CONSTRAINT custom_forms_pkey PRIMARY KEY (id)
    );

    -- Add foreign key constraints
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'custom_forms_client_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'custom_forms'
      ) THEN
        ALTER TABLE public.custom_forms 
        ADD CONSTRAINT custom_forms_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'custom_forms_created_by_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'custom_forms'
      ) THEN
        ALTER TABLE public.custom_forms 
        ADD CONSTRAINT custom_forms_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES public.employees(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_custom_forms_client_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_custom_forms_client_id ON public.custom_forms USING btree (client_id);
    END IF;
  END IF;
END $$;

