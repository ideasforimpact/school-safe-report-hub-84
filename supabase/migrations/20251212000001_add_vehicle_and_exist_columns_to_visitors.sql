-- Add vehicle_no, vehicle_type, and is_exit columns to visitors table

DO $$
BEGIN
  -- Add vehicle_no column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'visitors' 
    AND column_name = 'vehicle_no'
  ) THEN
    ALTER TABLE public.visitors ADD COLUMN vehicle_no text;
  END IF;

  -- Add vehicle_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'visitors' 
    AND column_name = 'vehicle_type'
  ) THEN
    ALTER TABLE public.visitors ADD COLUMN vehicle_type text;
  END IF;

  -- Add is_exit column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'visitors' 
    AND column_name = 'is_exit'
  ) THEN
    ALTER TABLE public.visitors ADD COLUMN is_exit boolean DEFAULT false NOT NULL;
  END IF;

  -- Add comments
  BEGIN
    COMMENT ON COLUMN public.visitors.vehicle_no IS 'Vehicle number of the visitor';
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    COMMENT ON COLUMN public.visitors.vehicle_type IS 'Type of vehicle (e.g., two_wheeler, four_wheeler)';
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    COMMENT ON COLUMN public.visitors.is_exit IS 'Flag indicating if visitor has exited the premises';
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

