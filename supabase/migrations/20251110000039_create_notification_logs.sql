-- Create notification_logs table
-- This migration creates the notification_logs table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notification_logs'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.notification_logs (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      module text NOT NULL,
      type text NOT NULL,
      recipient_id uuid,
      recipient_email text,
      subject text NOT NULL,
      body text NOT NULL,
      status text NOT NULL,
      error_message text,
      sent_at timestamp with time zone,
      created_at timestamp with time zone DEFAULT now(),
      metadata jsonb DEFAULT '{}'::jsonb,
      email_queue_id uuid,
      remainder_cron_status boolean DEFAULT false,
      remainder_cron_logs text,
      updated_at timestamp with time zone DEFAULT now(),
      CONSTRAINT notification_logs_pkey PRIMARY KEY (id),
      CONSTRAINT notification_logs_status_check CHECK (
        status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text, 'skipped'::text])
      )
    );

    -- Add foreign key constraints
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_notification_logs_recipient' 
        AND table_schema = 'public' 
        AND table_name = 'notification_logs'
      ) THEN
        ALTER TABLE public.notification_logs 
        ADD CONSTRAINT fk_notification_logs_recipient 
        FOREIGN KEY (recipient_id) REFERENCES public.employees(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_queue') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'notification_logs_email_queue_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'notification_logs'
      ) THEN
        ALTER TABLE public.notification_logs 
        ADD CONSTRAINT notification_logs_email_queue_id_fkey 
        FOREIGN KEY (email_queue_id) REFERENCES public.email_queue(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_notification_logs_recipient' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_notification_logs_recipient ON public.notification_logs USING btree (recipient_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_notification_logs_status' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_notification_logs_status ON public.notification_logs USING btree (status);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_notification_logs_created_at' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_notification_logs_created_at ON public.notification_logs USING btree (created_at DESC);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_notification_logs_module_type' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_notification_logs_module_type ON public.notification_logs USING btree (module, type);
    END IF;
  END IF;
END $$;

