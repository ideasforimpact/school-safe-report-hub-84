-- Add RLS policies for vehicle_type table
-- This migration is idempotent and can be safely rerun

DO $$
BEGIN
  -- Enable RLS on vehicle_type table
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'vehicle_type'
  ) THEN
    ALTER TABLE public.vehicle_type ENABLE ROW LEVEL SECURITY;
    
    -- Policy: Anyone authenticated can view vehicle types (read-only reference data)
    DROP POLICY IF EXISTS "Anyone authenticated can view vehicle types" ON public.vehicle_type;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'vehicle_type' 
      AND policyname = 'Anyone authenticated can view vehicle types'
    ) THEN
      CREATE POLICY "Anyone authenticated can view vehicle types" ON public.vehicle_type
        FOR SELECT
        USING (auth.uid() IS NOT NULL);
    END IF;
    
    RAISE NOTICE 'RLS policies added for vehicle_type table';
  ELSE
    RAISE NOTICE 'vehicle_type table does not exist, skipping RLS policy creation';
  END IF;
END $$;

