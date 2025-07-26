-- Clean up email data by removing trailing whitespace and newlines
UPDATE public.employees 
SET email = TRIM(email)
WHERE email != TRIM(email);