
-- Create storage bucket for employee other type statements
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee_other_type_statement', 'employee_other_type_statement', false);

-- Disable RLS on the bucket by not creating any restrictive policies
-- This allows all operations without RLS checks
