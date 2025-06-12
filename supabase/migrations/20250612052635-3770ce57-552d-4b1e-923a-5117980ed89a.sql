
-- Update the Employee Verification module URL to match the correct backoffice route
UPDATE public.modules 
SET url = '/backoffice/employee-verification' 
WHERE name = 'Employee Verification' AND level = 'backoffice';
