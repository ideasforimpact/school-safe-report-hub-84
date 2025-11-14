
-- Insert a new document status "completed" into the document_status table
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  -- Check if the document_status table exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'document_status'
  ) THEN
INSERT INTO public.document_status (name, description) 
VALUES ('completed', 'Document has been completed and verified by backoffice staff')
ON CONFLICT (name) DO NOTHING;
  END IF;
END $$;
