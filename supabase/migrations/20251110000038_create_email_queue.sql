-- Create email_queue table
-- This migration creates the email_queue table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'email_queue'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.email_queue (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      module_name text NOT NULL,
      notification_type text NOT NULL,
      client_id uuid,
      recipient_email text,
      recipient_name text,
      subject text NOT NULL,
      body text NOT NULL,
      params jsonb DEFAULT '{}'::jsonb NOT NULL,
      is_sent boolean DEFAULT false NOT NULL,
      sent_at timestamp with time zone,
      error_message text,
      retry_count integer DEFAULT 0 NOT NULL,
      max_retries integer DEFAULT 3 NOT NULL,
      priority integer DEFAULT 0 NOT NULL,
      scheduled_at timestamp with time zone DEFAULT now() NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      is_remainder_cron_started boolean DEFAULT false,
      active boolean DEFAULT true,
      CONSTRAINT email_queue_pkey PRIMARY KEY (id)
    );

    -- Add foreign key constraint
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'email_queue_client_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'email_queue'
      ) THEN
        ALTER TABLE public.email_queue 
        ADD CONSTRAINT email_queue_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
      END IF;
    END IF;

    -- Create indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_email_queue_is_sent' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_email_queue_is_sent ON public.email_queue USING btree (is_sent);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_email_queue_module_type' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_email_queue_module_type ON public.email_queue USING btree (module_name, notification_type);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_email_queue_client_id' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_email_queue_client_id ON public.email_queue USING btree (client_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_email_queue_scheduled_at' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_email_queue_scheduled_at ON public.email_queue USING btree (scheduled_at);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_email_queue_priority' 
      AND schemaname = 'public'
    ) THEN
      CREATE INDEX idx_email_queue_priority ON public.email_queue USING btree (priority);
    END IF;
  END IF;
END $$;

