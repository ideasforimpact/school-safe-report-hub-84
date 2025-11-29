-- Create vehicle_type table, change vehicles.type to UUID, and migrate existing data
-- This migration is idempotent and can be safely rerun

DO $$
DECLARE
  car_id uuid;
  van_id uuid;
  motorcycle_id uuid;
  bus_id uuid;
  tractor_id uuid;
  others_id uuid;
  temp_type_column text;
BEGIN
  -- Step 1: Create vehicle_type table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'vehicle_type'
  ) THEN
    CREATE TABLE public.vehicle_type (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      name text NOT NULL UNIQUE,
      icon text,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT vehicle_type_pkey PRIMARY KEY (id)
    );
    
    RAISE NOTICE 'Created vehicle_type table';
  ELSE
    RAISE NOTICE 'vehicle_type table already exists';
  END IF;

  -- Step 2: Add icon column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicle_type' 
    AND column_name = 'icon'
  ) THEN
    ALTER TABLE public.vehicle_type 
    ADD COLUMN icon text;
    
    RAISE NOTICE 'Added icon column to vehicle_type table';
  END IF;

  -- Step 3: Insert default vehicle types if they don't exist
  -- Car
  INSERT INTO public.vehicle_type (name, icon)
  SELECT 'Car', 'car'
  WHERE NOT EXISTS (SELECT 1 FROM public.vehicle_type WHERE name = 'Car')
  RETURNING id INTO car_id;
  
  IF car_id IS NULL THEN
    SELECT id INTO car_id FROM public.vehicle_type WHERE name = 'Car';
    -- Update icon if it's NULL
    UPDATE public.vehicle_type SET icon = 'car' WHERE name = 'Car' AND icon IS NULL;
  END IF;

  -- Van
  INSERT INTO public.vehicle_type (name, icon)
  SELECT 'Van', 'van'
  WHERE NOT EXISTS (SELECT 1 FROM public.vehicle_type WHERE name = 'Van')
  RETURNING id INTO van_id;
  
  IF van_id IS NULL THEN
    SELECT id INTO van_id FROM public.vehicle_type WHERE name = 'Van';
    -- Update icon if it's NULL
    UPDATE public.vehicle_type SET icon = 'van' WHERE name = 'Van' AND icon IS NULL;
  END IF;

  -- Motorcycle
  INSERT INTO public.vehicle_type (name, icon)
  SELECT 'Motorcycle', 'motorcycle'
  WHERE NOT EXISTS (SELECT 1 FROM public.vehicle_type WHERE name = 'Motorcycle')
  RETURNING id INTO motorcycle_id;
  
  IF motorcycle_id IS NULL THEN
    SELECT id INTO motorcycle_id FROM public.vehicle_type WHERE name = 'Motorcycle';
    -- Update icon if it's NULL
    UPDATE public.vehicle_type SET icon = 'motorcycle' WHERE name = 'Motorcycle' AND icon IS NULL;
  END IF;

  -- Bus
  INSERT INTO public.vehicle_type (name, icon)
  SELECT 'Bus', 'bus'
  WHERE NOT EXISTS (SELECT 1 FROM public.vehicle_type WHERE name = 'Bus')
  RETURNING id INTO bus_id;
  
  IF bus_id IS NULL THEN
    SELECT id INTO bus_id FROM public.vehicle_type WHERE name = 'Bus';
    -- Update icon if it's NULL
    UPDATE public.vehicle_type SET icon = 'bus' WHERE name = 'Bus' AND icon IS NULL;
  END IF;

  -- Tractor
  INSERT INTO public.vehicle_type (name, icon)
  SELECT 'Tractor', 'tractor'
  WHERE NOT EXISTS (SELECT 1 FROM public.vehicle_type WHERE name = 'Tractor')
  RETURNING id INTO tractor_id;
  
  IF tractor_id IS NULL THEN
    SELECT id INTO tractor_id FROM public.vehicle_type WHERE name = 'Tractor';
    -- Update icon if it's NULL
    UPDATE public.vehicle_type SET icon = 'tractor' WHERE name = 'Tractor' AND icon IS NULL;
  END IF;

  -- Others
  INSERT INTO public.vehicle_type (name, icon)
  SELECT 'Others', 'other'
  WHERE NOT EXISTS (SELECT 1 FROM public.vehicle_type WHERE name = 'Others')
  RETURNING id INTO others_id;
  
  IF others_id IS NULL THEN
    SELECT id INTO others_id FROM public.vehicle_type WHERE name = 'Others';
    -- Update icon if it's NULL
    UPDATE public.vehicle_type SET icon = 'other' WHERE name = 'Others' AND icon IS NULL;
  END IF;

  RAISE NOTICE 'Default vehicle types inserted with icons';

  -- Step 4: Check if vehicles.type is already UUID
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicles' 
    AND column_name = 'type'
    AND data_type = 'uuid'
  ) THEN
    RAISE NOTICE 'vehicles.type column is already UUID, skipping migration';
  ELSE
    -- Step 5: Add temporary column to store UUID values
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'vehicles' 
      AND column_name = 'type_uuid_temp'
    ) THEN
      ALTER TABLE public.vehicles 
      ADD COLUMN type_uuid_temp uuid;
      
      RAISE NOTICE 'Added temporary type_uuid_temp column';
    END IF;

    -- Step 6: Map existing text values to UUIDs
    UPDATE public.vehicles
    SET type_uuid_temp = CASE
      WHEN LOWER(TRIM(type)) = 'car' THEN car_id
      WHEN LOWER(TRIM(type)) = 'van' THEN van_id
      WHEN LOWER(TRIM(type)) = 'motorcycle' THEN motorcycle_id
      WHEN LOWER(TRIM(type)) = 'bus' THEN bus_id
      WHEN LOWER(TRIM(type)) = 'tractor' THEN tractor_id
      ELSE others_id
    END
    WHERE type_uuid_temp IS NULL;

    -- Set default to 'Car' for any NULL values
    UPDATE public.vehicles
    SET type_uuid_temp = car_id
    WHERE type_uuid_temp IS NULL;

    RAISE NOTICE 'Mapped existing type values to UUIDs';

    -- Step 7: Drop the old type column
    ALTER TABLE public.vehicles 
    DROP COLUMN IF EXISTS type;

    RAISE NOTICE 'Dropped old type column';

    -- Step 8: Rename the temporary column to type
    ALTER TABLE public.vehicles 
    RENAME COLUMN type_uuid_temp TO type;

    RAISE NOTICE 'Renamed type_uuid_temp to type';

    -- Step 9: Make type NOT NULL and add foreign key constraint
    ALTER TABLE public.vehicles 
    ALTER COLUMN type SET NOT NULL;

    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.table_constraints 
      WHERE constraint_name = 'vehicles_type_fkey' 
      AND table_schema = 'public' 
      AND table_name = 'vehicles'
    ) THEN
      ALTER TABLE public.vehicles 
      ADD CONSTRAINT vehicles_type_fkey 
      FOREIGN KEY (type) REFERENCES public.vehicle_type(id) ON DELETE RESTRICT;
      
      RAISE NOTICE 'Added foreign key constraint for vehicles.type';
    END IF;
  END IF;

  -- Step 10: Create index on vehicle_type.name for faster lookups
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE indexname = 'idx_vehicle_type_name' 
    AND schemaname = 'public'
  ) THEN
    CREATE INDEX idx_vehicle_type_name ON public.vehicle_type USING btree (name);
    RAISE NOTICE 'Created index on vehicle_type.name';
  END IF;

END $$;

