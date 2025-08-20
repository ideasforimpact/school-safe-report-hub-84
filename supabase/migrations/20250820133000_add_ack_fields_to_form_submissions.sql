-- Add acknowledged metadata to form_submissions
ALTER TABLE public.form_submissions
	ADD COLUMN IF NOT EXISTS acknowledged_by_name TEXT,
	ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ; 