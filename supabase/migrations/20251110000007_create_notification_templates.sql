-- Create notification_templates table
-- This migration creates the notification_templates table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notification_templates'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.notification_templates (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      module text NOT NULL,
      type text NOT NULL,
      subject text NOT NULL,
      body text NOT NULL,
      variables jsonb DEFAULT '[]'::jsonb,
      is_active boolean DEFAULT true,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      CONSTRAINT notification_templates_pkey PRIMARY KEY (id)
    );

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_notification_templates_module_type' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_notification_templates_module_type ON public.notification_templates USING btree (module, type);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_notification_templates_active' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_notification_templates_active ON public.notification_templates USING btree (is_active);
    END IF;
  END IF;
END $$;

