
-- Add reopen column to incidents table
ALTER TABLE public.incidents 
ADD COLUMN reopen integer NOT NULL DEFAULT 0;

-- Add comment to explain the column purpose
COMMENT ON COLUMN public.incidents.reopen IS 'Tracks how many times an incident has been reopened. Default 0 means never reopened.';
