                                                                                                                                                                -- Add new domains array column to clients table
-- This stores multiple domains as an array of objects with additional metadata

-- Check if clients table exists before attempting to modify it
DO $$
BEGIN
  -- Check if the clients table exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'clients'
  ) THEN
    -- Check if the column doesn't already exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'clients' 
      AND column_name = 'domains'
    ) THEN
ALTER TABLE clients 
ADD COLUMN domains JSONB DEFAULT '[]'::jsonb;

-- Add a comment to document the new column
COMMENT ON COLUMN clients.domains IS 'Array of domain objects for the client organization. Each object can contain domain, type, and other metadata.';

-- Create an index on the domains column for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_domains ON clients USING GIN (domains);
    END IF;
  END IF;
END $$;

-- Example structure for domains array:
-- [
--   {
--     "domain": "example.com",
--     "type": "primary",
--     "description": "Main domain for client",
--     "isActive": true
--   },
--   {
--     "domain": "subdomain.example.com", 
--     "type": "subdomain",
--     "description": "Subdomain for specific services",
--     "isActive": true
--   }
-- ]
                                                                                                                                                            