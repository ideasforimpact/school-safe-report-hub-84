-- Create sop_signoff_request table
-- This migration creates the sop_signoff_request table for tracking SOP signoff requests by employees

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'sop_signoff_request'
  ) THEN
    CREATE TABLE public.sop_signoff_request (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      sop_id uuid NOT NULL,
      employee_id uuid NOT NULL,
      client_id uuid NOT NULL,
      group_id uuid,
      is_completed boolean DEFAULT false NOT NULL,
      completed_date timestamptz,
      created_at timestamptz DEFAULT now() NOT NULL,
      updated_at timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT sop_signoff_request_pkey PRIMARY KEY (id)
    );

    -- Add comment
    COMMENT ON TABLE public.sop_signoff_request IS 'Stores SOP signoff requests for employees';
  END IF;
END $$;

-- Add foreign key constraints
DO $$
BEGIN
  -- FK to sop table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sop')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sop_signoff_request_sop_id_fkey') THEN
    ALTER TABLE public.sop_signoff_request
      ADD CONSTRAINT sop_signoff_request_sop_id_fkey
      FOREIGN KEY (sop_id) REFERENCES public.sop(id) ON DELETE CASCADE;
  END IF;

  -- FK to employees table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employees')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sop_signoff_request_employee_id_fkey') THEN
    ALTER TABLE public.sop_signoff_request
      ADD CONSTRAINT sop_signoff_request_employee_id_fkey
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
  END IF;

  -- FK to clients table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clients')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sop_signoff_request_client_id_fkey') THEN
    ALTER TABLE public.sop_signoff_request
      ADD CONSTRAINT sop_signoff_request_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;

  -- FK to groups table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='groups')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sop_signoff_request_group_id_fkey') THEN
    ALTER TABLE public.sop_signoff_request
      ADD CONSTRAINT sop_signoff_request_group_id_fkey
      FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sop_signoff_request_sop_id ON public.sop_signoff_request (sop_id);
CREATE INDEX IF NOT EXISTS idx_sop_signoff_request_employee_id ON public.sop_signoff_request (employee_id);
CREATE INDEX IF NOT EXISTS idx_sop_signoff_request_client_id ON public.sop_signoff_request (client_id);
CREATE INDEX IF NOT EXISTS idx_sop_signoff_request_group_id ON public.sop_signoff_request (group_id);
CREATE INDEX IF NOT EXISTS idx_sop_signoff_request_is_completed ON public.sop_signoff_request (is_completed);

-- ============================================
-- RLS Policies for sop_signoff_request table
-- Following the same pattern as sop and sop_assigned tables
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'sop_signoff_request'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.sop_signoff_request ENABLE ROW LEVEL SECURITY;

    -- Policy 1: Allow authentication function access
    DROP POLICY IF EXISTS "Allow authentication function access" ON public.sop_signoff_request;
    BEGIN
      CREATE POLICY "Allow authentication function access" ON public.sop_signoff_request
      FOR SELECT USING (
        current_setting('role'::text) = 'authenticated'::text 
        OR current_setting('role'::text) = 'anon'::text 
        OR current_setting('role'::text) = 'postgres'::text
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 2: Users can view signoff requests from their client
    DROP POLICY IF EXISTS "Users can view signoff requests from their client" ON public.sop_signoff_request;
    BEGIN
      CREATE POLICY "Users can view signoff requests from their client" ON public.sop_signoff_request
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id()
          OR EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.id = sop_signoff_request.employee_id
            AND employees.client_id = public.get_current_user_client_id()
          )
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 3: Users can insert signoff requests for their client only
    DROP POLICY IF EXISTS "Users can insert signoff requests for their client only" ON public.sop_signoff_request;
    BEGIN
      CREATE POLICY "Users can insert signoff requests for their client only" ON public.sop_signoff_request
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id()
          OR EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.id = sop_signoff_request.employee_id
            AND employees.client_id = public.get_current_user_client_id()
          )
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 4: Users can update signoff requests from their client only
    DROP POLICY IF EXISTS "Users can update signoff requests from their client only" ON public.sop_signoff_request;
    BEGIN
      CREATE POLICY "Users can update signoff requests from their client only" ON public.sop_signoff_request
      FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id()
          OR EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.id = sop_signoff_request.employee_id
            AND employees.client_id = public.get_current_user_client_id()
          )
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy 5: Users can delete signoff requests from their client only
    DROP POLICY IF EXISTS "Users can delete signoff requests from their client only" ON public.sop_signoff_request;
    BEGIN
      CREATE POLICY "Users can delete signoff requests from their client only" ON public.sop_signoff_request
      FOR DELETE USING (
        auth.uid() IS NOT NULL 
        AND (
          client_id = public.get_current_user_client_id()
          OR EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.id = sop_signoff_request.employee_id
            AND employees.client_id = public.get_current_user_client_id()
          )
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;
