-- Add verified_by column to employee_documents table to track which employee verified the document
-- This migration is conditional to avoid errors if tables don't exist yet
DO $$
BEGIN
  -- Check if employee_documents table exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'employee_documents'
  ) THEN
    -- Add column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'employee_documents' 
      AND column_name = 'verified_by'
    ) THEN
      ALTER TABLE public.employee_documents 
      ADD COLUMN verified_by UUID;
      
      -- Add FK constraint if employees table exists and constraint doesn't exist
      IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'employees'
      ) THEN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.table_constraints 
          WHERE table_schema = 'public' 
          AND table_name = 'employee_documents' 
          AND constraint_name = 'employee_documents_verified_by_fkey'
        ) THEN
          ALTER TABLE public.employee_documents 
          ADD CONSTRAINT employee_documents_verified_by_fkey
          FOREIGN KEY (verified_by) REFERENCES public.employees(id);
        END IF;
      END IF;
    END IF;
  END IF;
END $$;