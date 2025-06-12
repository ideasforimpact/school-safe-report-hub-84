
-- Drop existing restrictive policies on employee_other_type_statement bucket if any
DROP POLICY IF EXISTS "Allow all operations on employee_other_type_statement bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to employee_other_type_statement" ON storage.objects;
DROP POLICY IF EXISTS "Allow insert to employee_other_type_statement" ON storage.objects;
DROP POLICY IF EXISTS "Allow update to employee_other_type_statement" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete from employee_other_type_statement" ON storage.objects;

-- Create permissive policies for employee_other_type_statement bucket
CREATE POLICY "Allow public read access to employee_other_type_statement" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'employee_other_type_statement');

CREATE POLICY "Allow public upload to employee_other_type_statement" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'employee_other_type_statement');

CREATE POLICY "Allow public update to employee_other_type_statement" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'employee_other_type_statement');

CREATE POLICY "Allow public delete from employee_other_type_statement" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'employee_other_type_statement');
