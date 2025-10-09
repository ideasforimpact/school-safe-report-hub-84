-- Add nullable designation column to employees table
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS designation text NULL;

