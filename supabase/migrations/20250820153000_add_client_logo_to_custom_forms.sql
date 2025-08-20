-- Add client_logo to custom_forms
ALTER TABLE public.custom_forms
	ADD COLUMN IF NOT EXISTS client_logo TEXT; 