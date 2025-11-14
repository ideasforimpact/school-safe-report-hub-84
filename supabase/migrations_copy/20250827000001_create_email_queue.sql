-- Create email queue table for processing emails via cron jobs
-- This migration is conditional to avoid errors if tables don't exist yet
DO $$
BEGIN
  -- Create table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'email_queue'
  ) THEN
    CREATE TABLE public.email_queue (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      module_name TEXT NOT NULL,
      notification_type TEXT NOT NULL,
      client_id UUID,
      recipient_email TEXT NOT NULL,
      recipient_name TEXT,
      subject TEXT NOT NULL,
      body TEXT NOT NULL, -- HTML content
      params JSONB NOT NULL DEFAULT '{}', -- Store all email data as JSON
      is_sent BOOLEAN DEFAULT FALSE,
      sent_at TIMESTAMP WITH TIME ZONE,
      error_message TEXT,
      retry_count INTEGER DEFAULT 0,
      max_retries INTEGER DEFAULT 3,
      priority INTEGER DEFAULT 0, -- 0=normal, 1=high, 2=urgent
      scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Add FK constraint if clients table exists
    IF EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'clients'
    ) THEN
      ALTER TABLE public.email_queue
      ADD CONSTRAINT email_queue_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_email_queue_is_sent ON public.email_queue(is_sent);
CREATE INDEX IF NOT EXISTS idx_email_queue_module_type ON public.email_queue(module_name, notification_type);
CREATE INDEX IF NOT EXISTS idx_email_queue_client_id ON public.email_queue(client_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_at ON public.email_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON public.email_queue(priority);

-- Enable RLS
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'email_queue'
  ) THEN
    ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

    -- Policy to allow service role to manage email queue
    DROP POLICY IF EXISTS "Service role can manage email queue" ON public.email_queue;
    CREATE POLICY "Service role can manage email queue"
    ON public.email_queue
    FOR ALL
    USING (auth.role() = 'service_role');

    -- Policy to allow users to view their own queued emails (if needed)
    DROP POLICY IF EXISTS "Users can view their own queued emails" ON public.email_queue;
    CREATE POLICY "Users can view their own queued emails"
    ON public.email_queue
    FOR SELECT
    USING (
      auth.uid() IS NOT NULL AND
      client_id = public.get_current_user_client_id()
    );
  END IF;
END $$;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'email_queue'
  ) THEN
    DROP TRIGGER IF EXISTS update_email_queue_updated_at ON public.email_queue;
    CREATE TRIGGER update_email_queue_updated_at
      BEFORE UPDATE ON public.email_queue
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$; 