
-- Add rework_comments column to assessments table
ALTER TABLE public.assessments 
ADD COLUMN rework_comments text;

-- Add comment to explain the column purpose
COMMENT ON COLUMN public.assessments.rework_comments IS 'Stores comments provided when an assessment is reworked by an admin';
