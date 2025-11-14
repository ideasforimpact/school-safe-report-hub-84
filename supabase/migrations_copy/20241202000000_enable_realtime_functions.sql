-- Function to set replica identity for a table
CREATE OR REPLACE FUNCTION public.set_replica_identity_for_table(
  table_name TEXT,
  identity_type TEXT DEFAULT 'FULL'
) RETURNS VOID AS $$
BEGIN
  EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY %s', table_name, identity_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add table to publication
CREATE OR REPLACE FUNCTION public.add_table_to_publication(
  table_name TEXT,
  publication_name TEXT DEFAULT 'supabase_realtime'
) RETURNS VOID AS $$
BEGIN
  EXECUTE format('ALTER PUBLICATION %I ADD TABLE public.%I', publication_name, table_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable real-time for backoffice_users table (conditional)
DO $$
BEGIN
  -- Check if the backoffice_users table exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'backoffice_users'
  ) THEN
    -- Set replica identity
    PERFORM set_replica_identity_for_table('backoffice_users');
    -- Add to publication (this may fail if publication doesn't exist, so we catch it)
    BEGIN
      PERFORM add_table_to_publication('backoffice_users');
    EXCEPTION
      WHEN OTHERS THEN
        -- Publication might not exist yet, skip silently
        NULL;
    END;
  END IF;
END $$;

