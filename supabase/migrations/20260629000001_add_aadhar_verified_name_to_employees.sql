ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS aadhar_verified_name TEXT DEFAULT NULL;


