
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
