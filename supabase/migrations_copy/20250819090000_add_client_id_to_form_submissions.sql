-- Add client_id column to form_submissions if it doesn't exist
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'form_submissions'
  ) THEN
    -- Add client_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'form_submissions' 
      AND column_name = 'client_id'
    ) THEN
      ALTER TABLE public.form_submissions
      ADD COLUMN client_id UUID;
    END IF;

    -- Also add submitter_phone column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'form_submissions' 
      AND column_name = 'submitter_phone'
    ) THEN
      ALTER TABLE public.form_submissions
      ADD COLUMN submitter_phone VARCHAR(50);
    END IF;

    -- Also add submitter_type column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'form_submissions' 
      AND column_name = 'submitter_type'
    ) THEN
      ALTER TABLE public.form_submissions
      ADD COLUMN submitter_type VARCHAR(50);
    END IF;

    -- Also add attachments column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'form_submissions' 
      AND column_name = 'attachments'
    ) THEN
      ALTER TABLE public.form_submissions
      ADD COLUMN attachments JSONB;
    END IF;
  END IF;
END $$;

-- Backfill client_id from related custom_forms
-- This update is conditional to avoid errors if tables don't exist yet
DO $$
BEGIN
  -- Check if both tables exist
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'form_submissions'
  ) AND EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'custom_forms'
  ) THEN
    UPDATE public.form_submissions fs
    SET client_id = cf.client_id
    FROM public.custom_forms cf
    WHERE fs.form_id = cf.id
      AND fs.client_id IS NULL;
  END IF;
END $$;

-- Add FK constraint to clients(id) if not exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'form_submissions'
  ) AND EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'clients'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'form_submissions'
        AND constraint_name = 'form_submissions_client_id_fkey'
    ) THEN
      ALTER TABLE public.form_submissions
      ADD CONSTRAINT form_submissions_client_id_fkey
      FOREIGN KEY (client_id)
      REFERENCES public.clients(id)
      ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Create index on client_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'form_submissions'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_form_submissions_client_id ON public.form_submissions(client_id);
  END IF;
END $$;

-- Create a trigger to auto-populate client_id from custom_forms on insert if not provided
CREATE OR REPLACE FUNCTION public.set_form_submission_client_id()
RETURNS trigger AS $$
BEGIN
	IF NEW.client_id IS NULL THEN
		SELECT client_id INTO NEW.client_id FROM public.custom_forms WHERE id = NEW.form_id;
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure a single trigger instance
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'form_submissions'
  ) THEN
    DROP TRIGGER IF EXISTS trg_set_form_submission_client_id ON public.form_submissions;
    CREATE TRIGGER trg_set_form_submission_client_id
    BEFORE INSERT ON public.form_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_form_submission_client_id();
  END IF;
END $$; 