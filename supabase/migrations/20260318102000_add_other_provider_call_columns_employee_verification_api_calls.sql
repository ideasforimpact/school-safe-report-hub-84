-- Add per-provider counters for fallback/secondary verification providers
-- (quickekyc primary, surepass fallback in driving-license).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'employee_verification_api_calls'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'employee_verification_api_calls'
        AND column_name = 'other_provider_success_call'
    ) THEN
      ALTER TABLE public.employee_verification_api_calls
        ADD COLUMN other_provider_success_call jsonb NOT NULL DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'employee_verification_api_calls'
        AND column_name = 'other_provider_failed_call'
    ) THEN
      ALTER TABLE public.employee_verification_api_calls
        ADD COLUMN other_provider_failed_call jsonb NOT NULL DEFAULT '{}'::jsonb;
    END IF;
  END IF;
END $$;

