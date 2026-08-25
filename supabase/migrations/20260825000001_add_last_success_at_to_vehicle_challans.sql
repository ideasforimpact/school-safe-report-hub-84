-- Add last_success_at to vehicle_challans
-- Tracks the timestamp of the last SUCCESSFUL (status 200) challan API call only.
-- updated_at is bumped on every attempt (success or failure) and can't be used to
-- gate the 48h cooldown, since a failing call must be retryable at any time.
-- This migration is idempotent and can be safely rerun.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'vehicle_challans'
    AND column_name = 'last_success_at'
  ) THEN
    ALTER TABLE public.vehicle_challans
    ADD COLUMN last_success_at timestamp with time zone DEFAULT NULL;

    RAISE NOTICE 'Added last_success_at column to vehicle_challans table';
  ELSE
    RAISE NOTICE 'Column last_success_at already exists in vehicle_challans table';
  END IF;
END $$;
