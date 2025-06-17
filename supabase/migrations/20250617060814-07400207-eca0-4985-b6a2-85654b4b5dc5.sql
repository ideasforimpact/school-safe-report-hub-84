
-- Add active column to modules table with default value true
ALTER TABLE public.modules 
ADD COLUMN active boolean NOT NULL DEFAULT true;
