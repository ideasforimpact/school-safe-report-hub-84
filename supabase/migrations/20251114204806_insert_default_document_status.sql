-- Insert default document status values
-- This migration inserts default document status values from production
-- IDs are auto-generated using gen_random_uuid() instead of hardcoded UUIDs

DO $$
BEGIN
  -- Only insert if table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'document_status'
  ) THEN
    -- Insert default document statuses only if they don't already exist
    -- Check by name to avoid duplicates (name has UNIQUE constraint)
    
    -- 1. pending
    IF NOT EXISTS (SELECT 1 FROM public.document_status WHERE name = 'pending') THEN
      INSERT INTO public.document_status (name, description, created_at, updated_at)
      VALUES ('pending', 'Document is pending verification', now(), now());
    END IF;

    -- 2. in-progress
    IF NOT EXISTS (SELECT 1 FROM public.document_status WHERE name = 'in-progress') THEN
      INSERT INTO public.document_status (name, description, created_at, updated_at)
      VALUES ('in-progress', 'Document is still in-progress', now(), now());
    END IF;

    -- 3. completed
    IF NOT EXISTS (SELECT 1 FROM public.document_status WHERE name = 'completed') THEN
      INSERT INTO public.document_status (name, description, created_at, updated_at)
      VALUES ('completed', 'Document has been completed and verified by backoffice staff', now(), now());
    END IF;

    -- 4. rejected
    IF NOT EXISTS (SELECT 1 FROM public.document_status WHERE name = 'rejected') THEN
      INSERT INTO public.document_status (name, description, created_at, updated_at)
      VALUES ('rejected', 'Document verification rejected', now(), now());
    END IF;

    -- 5. governance
    IF NOT EXISTS (SELECT 1 FROM public.document_status WHERE name = 'governance') THEN
      INSERT INTO public.document_status (name, description, created_at, updated_at)
      VALUES ('governance', 'Document is verified by governance', now(), now());
    END IF;

    -- 6. manual
    IF NOT EXISTS (SELECT 1 FROM public.document_status WHERE name = 'manual') THEN
      INSERT INTO public.document_status (name, description, created_at, updated_at)
      VALUES ('manual', 'Document is manually verified', now(), now());
    END IF;

  END IF;
END $$;

