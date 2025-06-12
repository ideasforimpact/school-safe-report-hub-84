
-- Insert a new document status "completed" into the document_status table
INSERT INTO public.document_status (name, description) 
VALUES ('completed', 'Document has been completed and verified by backoffice staff')
ON CONFLICT (name) DO NOTHING;
