-- Create required PostgreSQL extensions
-- This migration must run before any functions that depend on these extensions
-- Extensions are created to match production schema

-- Create pgcrypto extension (required for password hashing and encryption functions)
-- This MUST succeed - functions depend on it
-- In Supabase, extensions are typically in the 'extensions' schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

-- Ensure pgcrypto functions are accessible from public schema
-- This makes gen_salt, crypt, etc. available without schema prefix
DO $$
BEGIN
  -- Grant usage on extensions schema to public role
  GRANT USAGE ON SCHEMA extensions TO public;
  
  -- Grant execute on pgcrypto functions to public role
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO public;
EXCEPTION WHEN OTHERS THEN
  -- If grants fail, continue (might already be granted)
  NULL;
END $$;

-- Create pg_cron extension (required for cron monitoring functions)
-- In production, this is created with schema 'pg_catalog'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Extension might not be available in local environment
  -- This is okay - functions will handle it gracefully
  RAISE NOTICE 'pg_cron extension not available: %', SQLERRM;
END $$;

