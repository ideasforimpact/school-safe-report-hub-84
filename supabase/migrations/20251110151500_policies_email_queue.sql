-- RLS Policies for email_queue table
-- Enable RLS and create policies for email_queue table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'email_queue'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

    -- Policy: Service role can manage email queue
    -- Production line 3316: NO FOR ALL, just USING
    DROP POLICY IF EXISTS "Service role can manage email queue" ON public.email_queue;
    BEGIN
      CREATE POLICY "Service role can manage email queue" ON public.email_queue
      USING (auth.role() = 'service_role'::text);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Users can view their own queued emails
    DROP POLICY IF EXISTS "Users can view their own queued emails" ON public.email_queue;
    BEGIN
      CREATE POLICY "Users can view their own queued emails" ON public.email_queue
      FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND client_id = public.get_current_user_client_id()
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

