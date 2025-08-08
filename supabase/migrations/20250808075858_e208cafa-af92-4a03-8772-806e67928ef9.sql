-- Add verified_by column to employee_documents table to track which employee verified the document
ALTER TABLE public.employee_documents 
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.employees(id);