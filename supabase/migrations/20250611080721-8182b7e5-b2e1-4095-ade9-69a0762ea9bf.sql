
-- Create storage bucket for bank statement analysis
INSERT INTO storage.buckets (id, name, public)
VALUES ('bank-statement-analysis', 'bank-statement-analysis', false);

-- Disable RLS on the bucket by not creating any restrictive policies
-- This allows all operations without RLS checks
