-- Widen the operation CHECK constraint on employee_verification_api_call_events so the
-- DigiLocker Aadhaar flow (digilocker_initialize / digilocker_download) can be tracked
-- alongside the existing OTP-based operations (generate_otp / verify_otp). DigiLocker
-- attempts still use provider='surepass' (same vendor as the OTP fallback) — only the
-- operation value distinguishes a DigiLocker attempt from an OTP one.

DO $$
DECLARE
  constraint_rec record;
BEGIN
  FOR constraint_rec IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'employee_verification_api_call_events'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%operation%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.employee_verification_api_call_events DROP CONSTRAINT %I',
      constraint_rec.conname
    );
  END LOOP;

  ALTER TABLE public.employee_verification_api_call_events
    ADD CONSTRAINT employee_verification_api_call_events_operation_check
    CHECK (operation IN ('generate_otp', 'verify_otp', 'digilocker_initialize', 'digilocker_download'));
END $$;
