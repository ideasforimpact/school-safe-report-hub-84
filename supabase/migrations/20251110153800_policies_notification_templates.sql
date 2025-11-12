-- RLS Policies for notification_templates table
-- Enable RLS and create policies for notification_templates table

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notification_templates'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

    -- Policy: Allow authenticated users to read notification templates
    DROP POLICY IF EXISTS "Allow authenticated users to read notification templates" ON public.notification_templates;
    BEGIN
      CREATE POLICY "Allow authenticated users to read notification templates" ON public.notification_templates
      FOR SELECT USING (auth.role() = 'authenticated');
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;


