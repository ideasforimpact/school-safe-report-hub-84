-- Migrate visitors.vehicle_type from text to UUID referencing visitor_vehicle_type(id)
-- This migration is idempotent and safe to rerun.

DO $$
BEGIN
  -- Ensure visitor_vehicle_type table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'visitor_vehicle_type'
  ) THEN
    RAISE EXCEPTION 'visitor_vehicle_type table does not exist. Run create_visitor_vehicle_type_table migration first.';
  END IF;

  -- Add temporary UUID column if it does not exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'visitors'
      AND column_name = 'vehicle_type_uuid_temp'
  ) THEN
    ALTER TABLE public.visitors
      ADD COLUMN vehicle_type_uuid_temp uuid;
  END IF;

  -- Map existing text vehicle_type values to visitor_vehicle_type UUIDs using the key column
  -- Only run this mapping if there are any text values and temp column is still NULL
  UPDATE public.visitors v
  SET vehicle_type_uuid_temp = vvt.id
  FROM public.visitor_vehicle_type vvt
  WHERE v.vehicle_type IS NOT NULL
    AND v.vehicle_type_uuid_temp IS NULL
    AND lower(trim(v.vehicle_type)) = lower(trim(vvt.key));

  -- At this point, any rows that couldn't be mapped will keep vehicle_type_uuid_temp as NULL.
  -- We allow NULLs so that existing data isn't lost; application can enforce stricter rules if needed.

  -- Drop existing foreign key on visitors.vehicle_type if it exists (defensive)
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'visitors'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND tc.constraint_name = 'visitors_vehicle_type_fkey'
  ) THEN
    ALTER TABLE public.visitors
      DROP CONSTRAINT visitors_vehicle_type_fkey;
  END IF;

  -- Change column type: drop old text column, rename temp to vehicle_type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'visitors'
      AND column_name = 'vehicle_type'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE public.visitors
      DROP COLUMN vehicle_type;
  END IF;

  -- Rename temp column to vehicle_type if the final column doesn't already exist as UUID
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'visitors'
      AND column_name = 'vehicle_type'
  ) THEN
    ALTER TABLE public.visitors
      RENAME COLUMN vehicle_type_uuid_temp TO vehicle_type;
  END IF;

  -- Ensure vehicle_type column is UUID (nullable) and add FK to visitor_vehicle_type(id)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'visitors'
      AND column_name = 'vehicle_type'
  ) THEN
    -- Make sure type is UUID (cast if necessary)
    ALTER TABLE public.visitors
      ALTER COLUMN vehicle_type TYPE uuid
      USING vehicle_type::uuid;

    -- Add FK if it doesn't exist
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      WHERE tc.table_schema = 'public'
        AND tc.table_name = 'visitors'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND tc.constraint_name = 'visitors_vehicle_type_fkey'
    ) THEN
      ALTER TABLE public.visitors
        ADD CONSTRAINT visitors_vehicle_type_fkey
        FOREIGN KEY (vehicle_type) REFERENCES public.visitor_vehicle_type(id) ON DELETE RESTRICT;
    END IF;
  END IF;

  -- Helpful index for lookups on vehicle_type
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_visitors_vehicle_type'
  ) THEN
    CREATE INDEX idx_visitors_vehicle_type ON public.visitors USING btree (vehicle_type);
  END IF;

END $$;


