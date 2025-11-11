-- Fix RLS policies for assessments table to properly handle assigned_to field
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assessments') THEN
    -- Drop existing problematic policies
    DROP POLICY IF EXISTS "Users can view assessments from their client or involvement" ON public.assessments;
    DROP POLICY IF EXISTS "Users can update assessments from their client involvement" ON public.assessments;

    -- Create updated SELECT policy that properly joins with employees table
    CREATE POLICY "Users can view assessments from their client or involvement" 
    ON public.assessments 
    FOR SELECT 
    USING (
      (auth.uid() IS NOT NULL) AND (
        -- Can view if from same client
        (client_id = get_current_user_client_id()) OR 
        -- Can view if they created it
        (created_by = auth.uid()) OR 
        -- Can view if assigned to them (join with employees to match user_id)
        (assigned_to IN (SELECT id FROM employees WHERE user_id = auth.uid())) OR
        -- Backoffice admin can view all
        (is_current_user_backoffice_admin() = true)
      )
    );

    -- Create updated UPDATE policy that properly joins with employees table  
    CREATE POLICY "Users can update assessments from their client involvement"
    ON public.assessments
    FOR UPDATE
    USING (
      (auth.uid() IS NOT NULL) AND (
        -- Can update if from same client AND (created by them OR assigned to them)
        ((client_id = get_current_user_client_id()) AND (
          (created_by = auth.uid()) OR 
          (assigned_to IN (SELECT id FROM employees WHERE user_id = auth.uid()))
        )) OR
        -- Backoffice admin can update all
        (is_current_user_backoffice_admin() = true)
      )
    );
  END IF;
END $$;