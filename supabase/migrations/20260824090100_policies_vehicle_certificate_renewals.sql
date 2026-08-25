-- RLS Policies for vehicle_certificate_renewals table
-- This table is written exclusively by the vehicle-verify edge function using the
-- service-role key (which bypasses RLS) — there is no manual-entry UI for renewal
-- history, so only a client-scoped SELECT policy is needed here.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'vehicle_certificate_renewals'
  ) THEN
    ALTER TABLE public.vehicle_certificate_renewals ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view vehicle certificate renewals from their client" ON public.vehicle_certificate_renewals;
    BEGIN
      CREATE POLICY "Users can view vehicle certificate renewals from their client" ON public.vehicle_certificate_renewals
      FOR SELECT USING (
        auth.uid() IS NOT NULL
        AND (
          client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;
