                                                                                                                                                                -- Add new domains array column to clients table
-- This stores multiple domains as an array of objects with additional metadata

ALTER TABLE clients 
ADD COLUMN domains JSONB DEFAULT '[]'::jsonb;

-- Add a comment to document the new column
COMMENT ON COLUMN clients.domains IS 'Array of domain objects for the client organization. Each object can contain domain, type, and other metadata.';

-- Create an index on the domains column for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_domains ON clients USING GIN (domains);

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
                                                                                                                                                            