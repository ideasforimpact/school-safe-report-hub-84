-- Diagnostic query to check why link_user_to_employee is failing
-- Run this in Supabase SQL Editor to check the employee record

-- Check the employee record with the email
SELECT 
  id,
  email,
  TRIM(BOTH E'\n\r\t ' FROM email) as trimmed_email,
  status,
  user_id,
  first_name,
  last_name,
  client_id,
  CASE 
    WHEN status = true THEN '✓ status is true'
    WHEN status = false THEN '✗ status is false'
    WHEN status IS NULL THEN '✗ status is NULL'
    ELSE '✗ status is unknown'
  END as status_check,
  CASE 
    WHEN user_id IS NULL THEN '✓ user_id is NULL (unlinked)'
    ELSE '✗ user_id is set (already linked): ' || user_id::text
  END as user_id_check,
  CASE 
    WHEN TRIM(BOTH E'\n\r\t ' FROM email) = 'safeschool@rakspallikkoodam.com' THEN '✓ email matches'
    ELSE '✗ email does not match'
  END as email_match_check
FROM public.employees 
WHERE email ILIKE '%safeschool@rakspallikkoodam.com%'
   OR TRIM(BOTH E'\n\r\t ' FROM email) = 'safeschool@rakspallikkoodam.com';

-- Check what the function would find
SELECT 
  id, 
  email, 
  status, 
  user_id,
  'Would be found by function' as result
FROM public.employees 
WHERE TRIM(BOTH E'\n\r\t ' FROM email) = 'safeschool@rakspallikkoodam.com'
  AND status = true
  AND user_id IS NULL;

-- If the record exists but user_id is set, you can unlink it with:
-- UPDATE public.employees 
-- SET user_id = NULL 
-- WHERE email = 'safeschool@rakspallikkoodam.com';

-- If the record exists but status is false, you can activate it with:
-- UPDATE public.employees 
-- SET status = true 
-- WHERE email = 'safeschool@rakspallikkoodam.com';




