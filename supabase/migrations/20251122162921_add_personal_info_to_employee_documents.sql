-- Add personal_info column to employee_documents table
-- This column stores personal information as JSONB and is nullable by default

DO $$
BEGIN
  -- Check if the column already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'employee_documents' 
    AND column_name = 'personal_info'
  ) THEN
    -- Add the personal_info column as JSONB, nullable
    ALTER TABLE public.employee_documents 
    ADD COLUMN personal_info jsonb;
    
    RAISE NOTICE 'Successfully added personal_info column to employee_documents table';
  ELSE
    RAISE NOTICE 'Column personal_info already exists in employee_documents table';
  END IF;
END $$;

