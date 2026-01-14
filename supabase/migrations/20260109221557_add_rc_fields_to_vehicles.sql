-- Add RC (Registration Certificate) related columns to vehicles table
-- This migration is idempotent and can be safely rerun

DO $$
BEGIN
  -- Add provider column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicles' 
    AND column_name = 'provider'
  ) THEN
    ALTER TABLE public.vehicles 
    ADD COLUMN provider text;
    
    RAISE NOTICE 'Added provider column to vehicles table';
  ELSE
    RAISE NOTICE 'Column provider already exists in vehicles table';
  END IF;

  -- Add status_code column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicles' 
    AND column_name = 'status_code'
  ) THEN
    ALTER TABLE public.vehicles 
    ADD COLUMN status_code text;
    
    RAISE NOTICE 'Added status_code column to vehicles table';
  ELSE
    RAISE NOTICE 'Column status_code already exists in vehicles table';
  END IF;

  -- Add success_api_count column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicles' 
    AND column_name = 'success_api_count'
  ) THEN
    ALTER TABLE public.vehicles 
    ADD COLUMN success_api_count integer DEFAULT 0 NOT NULL;
    
    RAISE NOTICE 'Added success_api_count column to vehicles table';
  ELSE
    RAISE NOTICE 'Column success_api_count already exists in vehicles table';
  END IF;

  -- Add error_api_count column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicles' 
    AND column_name = 'error_api_count'
  ) THEN
    ALTER TABLE public.vehicles 
    ADD COLUMN error_api_count integer DEFAULT 0 NOT NULL;
    
    RAISE NOTICE 'Added error_api_count column to vehicles table';
  ELSE
    RAISE NOTICE 'Column error_api_count already exists in vehicles table';
  END IF;

  -- Add current_rc_data column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicles' 
    AND column_name = 'current_rc_data'
  ) THEN
    ALTER TABLE public.vehicles 
    ADD COLUMN current_rc_data jsonb DEFAULT NULL;
    
    RAISE NOTICE 'Added current_rc_data column to vehicles table (JSONB, nullable)';
  ELSE
    RAISE NOTICE 'Column current_rc_data already exists in vehicles table';
  END IF;

  -- Add rc_status column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicles' 
    AND column_name = 'rc_status'
  ) THEN
    ALTER TABLE public.vehicles 
    ADD COLUMN rc_status  text  NULL;
    
    RAISE NOTICE 'Added rc_status column to vehicles table';
  ELSE
    RAISE NOTICE 'Column rc_status already exists in vehicles table';
  END IF;
END $$;


