-- Add client_logo to custom_forms
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'custom_forms') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'custom_forms' AND column_name = 'client_logo') THEN
      ALTER TABLE public.custom_forms
      ADD COLUMN client_logo TEXT;
    END IF;
  END IF;
END $$; 