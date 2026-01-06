-- Mark 'trusted_vehicles' visitor vehicle type as inactive
-- and keep the migration idempotent/safe to rerun.

DO $$
BEGIN
  -- Only update if the table and the key exist
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name   = 'visitor_vehicle_type'
  ) THEN
    UPDATE public.visitor_vehicle_type
    SET active     = false,
        updated_at = now()
    WHERE key = 'trusted_vehicles';
  END IF;
END $$;


