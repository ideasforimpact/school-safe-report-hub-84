-- Feature 1 + 2 follow-up: the "Form owners can view submissions" policy
-- on form_submissions used to walk through employees by user_id:
--     form_id IN (
--       SELECT id FROM custom_forms
--       WHERE client_id IN (
--         SELECT client_id FROM employees
--         WHERE user_id = auth.uid() AND status = true
--       )
--     )
-- That inner subquery returns one client_id per (user_id, client_id)
-- pair. With Feature 1, the same user_id now belongs to multiple clients
-- — so the IN list contains every one of them, silently merging
-- submissions from clients the user did NOT just pick in the picker.
--
-- We scope to the user's CURRENT active client via
-- public.get_current_user_client_id(), which already honors
-- user_client_context.target_client_id (set by the picker via the new
-- set_user_client_context_for_login RPC).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'form_submissions'
  ) THEN
    DROP POLICY IF EXISTS "Form owners can view submissions" ON public.form_submissions;

    BEGIN
      CREATE POLICY "Form owners can view submissions" ON public.form_submissions
      FOR SELECT USING (
        form_id IN (
          SELECT id FROM public.custom_forms
          WHERE client_id = public.get_current_user_client_id()
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;
