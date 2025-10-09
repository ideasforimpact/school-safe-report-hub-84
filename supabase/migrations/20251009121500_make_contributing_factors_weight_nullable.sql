-- Make weight column nullable on contributing_factors table
ALTER TABLE public.contributing_factors
ALTER COLUMN weight DROP NOT NULL;


