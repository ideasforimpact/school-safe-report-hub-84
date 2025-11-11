-- Make weight column nullable on contributing_factors table
-- This migration is conditional to avoid errors if the table doesn't exist yet
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'contributing_factors'
  ) THEN
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'contributing_factors' 
      AND column_name = 'weight'
      AND is_nullable = 'NO'
    ) THEN
      ALTER TABLE public.contributing_factors
      ALTER COLUMN weight DROP NOT NULL;
    END IF;
  END IF;
END $$;


