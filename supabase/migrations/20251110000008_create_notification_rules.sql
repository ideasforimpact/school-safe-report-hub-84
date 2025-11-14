-- Create notification_rules table
-- This migration creates the notification_rules table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notification_rules'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.notification_rules (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      module text NOT NULL,
      type text NOT NULL,
      name text NOT NULL,
      description text,
      is_active boolean DEFAULT true,
      skip_conditions jsonb DEFAULT '[]'::jsonb,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      CONSTRAINT notification_rules_pkey PRIMARY KEY (id)
    );

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_notification_rules_module_type' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_notification_rules_module_type ON public.notification_rules USING btree (module, type);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_notification_rules_active' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_notification_rules_active ON public.notification_rules USING btree (is_active);
    END IF;
  END IF;
END $$;

