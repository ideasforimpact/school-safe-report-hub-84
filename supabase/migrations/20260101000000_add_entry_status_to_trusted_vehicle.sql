-- Add entry_status column to trusted_vehicle table
-- This migration is idempotent and can be safely rerun

DO $$
BEGIN
  -- Check if the column already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'trusted_vehicle' 
    AND column_name = 'entry_status'
  ) THEN
    -- Add the column as text, nullable, with default NULL
    ALTER TABLE public.trusted_vehicle 
    ADD COLUMN entry_status text DEFAULT NULL;
    
    RAISE NOTICE 'Added entry_status column to trusted_vehicle table (text, nullable)';
  ELSE
    RAISE NOTICE 'Column entry_status already exists in trusted_vehicle table';
  END IF;
END $$;


