-- Change exit_time column on trusted_vehicle from date to timestamptz
-- so it can store full datetime values like in_time.
-- Idempotent: only alters the column if it exists and is currently of type date.

DO $$
DECLARE
  v_data_type text;
BEGIN
  SELECT data_type
  INTO v_data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name   = 'trusted_vehicle'
    AND column_name  = 'exit_time';

  IF v_data_type = 'date' THEN
    ALTER TABLE public.trusted_vehicle
      ALTER COLUMN exit_time TYPE timestamptz
      USING exit_time::timestamptz;

    BEGIN
      COMMENT ON COLUMN public.trusted_vehicle.exit_time IS
        'Timestamp when trusted vehicle was marked as OUT';
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END $$;



