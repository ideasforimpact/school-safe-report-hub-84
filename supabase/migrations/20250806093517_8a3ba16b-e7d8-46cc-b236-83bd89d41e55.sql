-- Fix the critical RLS security issues by enabling RLS on tables that don't have it

-- Enable RLS on any tables that need it (checking the linter output)
-- We need to identify which tables are missing RLS and enable it

-- First, let's check what tables don't have RLS enabled
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = pg_tables.tablename
            AND n.nspname = pg_tables.schemaname
            AND c.relrowsecurity = true
        )
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT IN ('spatial_ref_sys') -- Exclude system tables
    LOOP
        -- Enable RLS on tables that don't have it
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', table_record.schemaname, table_record.tablename);
        RAISE NOTICE 'Enabled RLS on table: %.%', table_record.schemaname, table_record.tablename;
    END LOOP;
END $$;