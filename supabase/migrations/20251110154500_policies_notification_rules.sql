-- RLS Policies for notification_rules table
-- Enable RLS and create policies for notification_rules table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notification_rules'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;

    -- Policy: Allow authenticated users to read notification rules
    DROP POLICY IF EXISTS "Allow authenticated users to read notification rules" ON public.notification_rules;
    BEGIN
      CREATE POLICY "Allow authenticated users to read notification rules" ON public.notification_rules
      FOR SELECT USING (auth.role() = 'authenticated');
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    -- Policy: Allow service role to manage notification rules
    DROP POLICY IF EXISTS "Allow service role to manage notification rules" ON public.notification_rules;
    BEGIN
      CREATE POLICY "Allow service role to manage notification rules" ON public.notification_rules
      FOR ALL USING (auth.role() = 'service_role');
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

