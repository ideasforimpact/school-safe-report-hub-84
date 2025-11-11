-- RLS Policies for notification_logs table
-- Enable RLS and create policies for notification_logs table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notification_logs'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

    -- Policy: Allow users to read their own notification logs
    DROP POLICY IF EXISTS "Allow users to read their own notification logs" ON public.notification_logs;
    BEGIN
      CREATE POLICY "Allow users to read their own notification logs" ON public.notification_logs
      FOR SELECT USING (auth.uid() = recipient_id);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Allow service role to insert notification logs
    DROP POLICY IF EXISTS "Allow service role to insert notification logs" ON public.notification_logs;
    BEGIN
      CREATE POLICY "Allow service role to insert notification logs" ON public.notification_logs
      FOR INSERT WITH CHECK (auth.role() = 'service_role');
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Allow service role to manage all notification logs
    DROP POLICY IF EXISTS "Allow service role to manage all notification logs" ON public.notification_logs;
    BEGIN
      CREATE POLICY "Allow service role to manage all notification logs" ON public.notification_logs
      FOR ALL USING (auth.role() = 'service_role');
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

