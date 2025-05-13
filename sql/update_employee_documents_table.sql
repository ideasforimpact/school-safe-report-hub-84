
-- This SQL migration changes the employee_documents table structure
-- from a jsonb documents array to individual document records with text URLs

-- Step 1: Create a new table with the desired structure
CREATE TABLE IF NOT EXISTS public.employee_documents_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id),
    document_type_id UUID REFERENCES public.employee_document_type(id),
    document_type_name TEXT,
    document_number TEXT,
    document_url TEXT,
    file_path TEXT,
    verification_status TEXT,
    document_status_id UUID REFERENCES public.document_status(id),
    document_status_name TEXT,
    verification_date TIMESTAMPTZ,
    verification_notes TEXT,
    verification_method TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Step 2: Create a migration function to move data from the old structure to the new one
CREATE OR REPLACE FUNCTION migrate_employee_documents() 
RETURNS void AS $$
DECLARE
    old_record RECORD;
    doc_record JSONB;
BEGIN
    -- Loop through each record in the old table
    FOR old_record IN SELECT * FROM public.employee_documents LOOP
        -- Loop through each document in the documents array
        IF old_record.documents IS NOT NULL AND jsonb_array_length(old_record.documents) > 0 THEN
            FOR i IN 0..jsonb_array_length(old_record.documents) - 1 LOOP
                doc_record := old_record.documents->i;
                
                -- Insert into new table
                INSERT INTO public.employee_documents_new (
                    id,
                    employee_id,
                    document_type_id,
                    document_type_name,
                    document_number,
                    document_url,
                    file_path,
                    verification_status,
                    document_status_id,
                    document_status_name,
                    verification_date,
                    verification_notes,
                    verification_method,
                    details,
                    created_at,
                    updated_at
                ) VALUES (
                    (doc_record->>'id')::UUID,
                    old_record.employee_id,
                    (doc_record->>'documentTypeId')::UUID,
                    doc_record->>'documentTypeName',
                    doc_record->>'documentNumber',
                    doc_record->>'documentImage',
                    doc_record->>'filePath',
                    doc_record->>'verificationStatus',
                    (doc_record->>'documentStatusId')::UUID,
                    doc_record->>'documentStatusName',
                    (doc_record->>'verificationDate')::TIMESTAMPTZ,
                    doc_record->>'verificationNotes',
                    doc_record->>'verificationMethod',
                    doc_record->'details',
                    COALESCE((doc_record->>'createdAt')::TIMESTAMPTZ, (doc_record->>'uploadedAt')::TIMESTAMPTZ, old_record.created_at),
                    COALESCE((doc_record->>'updatedAt')::TIMESTAMPTZ, old_record.updated_at)
                );
            END LOOP;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Execute the migration
SELECT migrate_employee_documents();

-- Step 4: Rename tables to complete the migration
ALTER TABLE public.employee_documents RENAME TO employee_documents_old;
ALTER TABLE public.employee_documents_new RENAME TO employee_documents;

-- Step 5: Clean up
DROP FUNCTION migrate_employee_documents();

-- Optional: Drop the old table after verifying the migration was successful
-- DROP TABLE public.employee_documents_old;
