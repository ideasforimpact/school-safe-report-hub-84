
-- Enable Row Level Security on employees table
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
    ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Policy to allow users to view employees only from their own client
-- This requires proper authentication and client context
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
    DROP POLICY IF EXISTS "Users can view employees from their client only" ON public.employees;
    CREATE POLICY "Users can view employees from their client only"
    ON public.employees
    FOR SELECT
    USING (
      -- Allow access if the user is authenticated and belongs to the same client
      auth.uid() IS NOT NULL AND
      client_id IN (
        SELECT e.client_id 
        FROM public.employees e 
        WHERE e.user_id = auth.uid()
        LIMIT 1
      )
    );

    -- Policy to allow backoffice users (SaaS admins) to view all employees
    DROP POLICY IF EXISTS "Backoffice users can view all employees" ON public.employees;
    CREATE POLICY "Backoffice users can view all employees"
    ON public.employees
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 
        FROM public.backoffice_users bu 
        WHERE bu.id = auth.uid() 
        AND bu.is_saas_admin = true
      )
    );

    -- Policy for inserting employees - only allow if user belongs to the client
    DROP POLICY IF EXISTS "Users can insert employees for their client only" ON public.employees;
    CREATE POLICY "Users can insert employees for their client only"
    ON public.employees
    FOR INSERT
    WITH CHECK (
      auth.uid() IS NOT NULL AND
      (
        -- Allow if user belongs to the same client
        client_id IN (
          SELECT e.client_id 
          FROM public.employees e 
          WHERE e.user_id = auth.uid()
          LIMIT 1
        )
        OR
        -- Allow backoffice users to insert for any client
        EXISTS (
          SELECT 1 
          FROM public.backoffice_users bu 
          WHERE bu.id = auth.uid() 
          AND bu.is_saas_admin = true
        )
      )
    );

    -- Policy for updating employees - only allow if user belongs to the client
    DROP POLICY IF EXISTS "Users can update employees from their client only" ON public.employees;
    CREATE POLICY "Users can update employees from their client only"
    ON public.employees
    FOR UPDATE
    USING (
      auth.uid() IS NOT NULL AND
      (
        -- Allow if user belongs to the same client
        client_id IN (
          SELECT e.client_id 
          FROM public.employees e 
          WHERE e.user_id = auth.uid()
          LIMIT 1
        )
        OR
        -- Allow backoffice users to update any employee
        EXISTS (
          SELECT 1 
          FROM public.backoffice_users bu 
          WHERE bu.id = auth.uid() 
          AND bu.is_saas_admin = true
        )
      )
    );

    -- Policy for deleting employees - only allow if user belongs to the client
    DROP POLICY IF EXISTS "Users can delete employees from their client only" ON public.employees;
    CREATE POLICY "Users can delete employees from their client only"
    ON public.employees
    FOR DELETE
    USING (
      auth.uid() IS NOT NULL AND
      (
        -- Allow if user belongs to the same client
        client_id IN (
          SELECT e.client_id 
          FROM public.employees e 
          WHERE e.user_id = auth.uid()
          LIMIT 1
        )
        OR
        -- Allow backoffice users to delete any employee
        EXISTS (
          SELECT 1 
          FROM public.backoffice_users bu 
          WHERE bu.id = auth.uid() 
          AND bu.is_saas_admin = true
        )
      )
    );
  END IF;
END $$;
