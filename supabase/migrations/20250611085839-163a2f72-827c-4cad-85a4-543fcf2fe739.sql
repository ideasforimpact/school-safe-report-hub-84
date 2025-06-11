
-- First, delete all objects from the old bucket
DELETE FROM storage.objects WHERE bucket_id = 'bank-statement-analysis';

-- Now we can safely delete the old bucket
DELETE FROM storage.buckets WHERE id = 'bank-statement-analysis';

-- Create new storage bucket for employee other type statements
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee_other_type_statement', 'employee_other_type_statement', false);

-- Disable RLS on the bucket by not creating any restrictive policies
-- This allows all operations without RLS checks
