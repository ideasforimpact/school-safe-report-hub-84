-- Update RLS policies for form_submissions to mirror client_modules/custom_forms
-- Uses form_submissions.client_id directly and preserves public inserts

BEGIN;

-- Ensure RLS is enabled
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe to re-run)
DROP POLICY IF EXISTS "Users can view form submissions from their client" ON public.form_submissions;
DROP POLICY IF EXISTS "Users can insert form submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Users can update form submissions from their client" ON public.form_submissions;
DROP POLICY IF EXISTS "Users can delete form submissions from their client" ON public.form_submissions;

-- SELECT: authenticated users can view submissions for their client or if backoffice admin
CREATE POLICY "Users can view form submissions from their client" 
ON public.form_submissions 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL)
  AND (
    (client_id = public.get_current_user_client_id())
    OR (public.is_current_user_backoffice_admin() = true)
  )
);

-- INSERT: allow public submissions for active forms; authenticated users for their client or backoffice
CREATE POLICY "Users can insert form submissions" 
ON public.form_submissions 
FOR INSERT 
WITH CHECK (
  -- Public submission allowed only if the target form is active
  (
    auth.uid() IS NULL
    AND EXISTS (
      SELECT 1 FROM public.custom_forms cf
      WHERE cf.id = form_id AND cf.is_active = true
    )
  )
  OR
  -- Authenticated users can submit for their client or if backoffice admin
  (
    auth.uid() IS NOT NULL AND (
      (client_id = public.get_current_user_client_id())
      OR (public.is_current_user_backoffice_admin() = true)
    )
  )
);

-- UPDATE: authenticated users for their client or backoffice admin
CREATE POLICY "Users can update form submissions from their client" 
ON public.form_submissions 
FOR UPDATE 
USING (
  (auth.uid() IS NOT NULL)
  AND (
    (client_id = public.get_current_user_client_id())
    OR (public.is_current_user_backoffice_admin() = true)
  )
);

-- DELETE: authenticated users for their client or backoffice admin
CREATE POLICY "Users can delete form submissions from their client" 
ON public.form_submissions 
FOR DELETE 
USING (
  (auth.uid() IS NOT NULL)
  AND (
    (client_id = public.get_current_user_client_id())
    OR (public.is_current_user_backoffice_admin() = true)
  )
);

COMMIT;







