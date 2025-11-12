-- Insert default values for reference tables
-- This migration inserts default seed data for client_type, employee_document_type, form_fields_type, and incident_status tables
-- All IDs are auto-generated UUIDs

-- ============================================
-- Default values for client_type table
-- ============================================
DO $$
DECLARE
  empty_count integer;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'client_type'
  ) THEN
   
    -- Insert institute
    INSERT INTO public.client_type (id, key, name, created_at, updated_at)
    SELECT gen_random_uuid(), 'institute', 'Institute', now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.client_type WHERE key = 'institute');

    -- Insert work
    INSERT INTO public.client_type (id, key, name, created_at, updated_at)
    SELECT gen_random_uuid(), 'work', 'Work', now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.client_type WHERE key = 'work');

    -- Insert school
    INSERT INTO public.client_type (id, key, name, created_at, updated_at)
    SELECT gen_random_uuid(), 'school', 'School', now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.client_type WHERE key = 'school');
  END IF;
END $$;

-- ============================================
-- Default values for employee_document_type table
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'employee_document_type'
  ) THEN
    -- Insert passport
    INSERT INTO public.employee_document_type (id, name, description, created_at, updated_at)
    SELECT gen_random_uuid(), 'passport', 'Passport', now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.employee_document_type WHERE name = 'passport');

    -- Insert driving_license
    INSERT INTO public.employee_document_type (id, name, description, created_at, updated_at)
    SELECT gen_random_uuid(), 'driving_license', 'Driving License', now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.employee_document_type WHERE name = 'driving_license');

    -- Insert bank_account
    INSERT INTO public.employee_document_type (id, name, description, created_at, updated_at)
    SELECT gen_random_uuid(), 'bank_account', 'Bank Account', now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.employee_document_type WHERE name = 'bank_account');

    -- Insert manual
    INSERT INTO public.employee_document_type (id, name, description, created_at, updated_at)
    SELECT gen_random_uuid(), 'manual', 'Manual Verification', now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.employee_document_type WHERE name = 'manual');

    -- Insert voter_id
    INSERT INTO public.employee_document_type (id, name, description, created_at, updated_at)
    SELECT gen_random_uuid(), 'voter_id', 'Voter ID', now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.employee_document_type WHERE name = 'voter_id');

    -- Insert aadhar
    INSERT INTO public.employee_document_type (id, name, description, created_at, updated_at)
    SELECT gen_random_uuid(), 'aadhar', 'Aadhar Card', now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.employee_document_type WHERE name = 'aadhar');

    -- Insert other_documents
    INSERT INTO public.employee_document_type (id, name, description, created_at, updated_at)
    SELECT gen_random_uuid(), 'other_documents', 'Other Documents', now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.employee_document_type WHERE name = 'other_documents');

    -- Insert pan
    INSERT INTO public.employee_document_type (id, name, description, created_at, updated_at)
    SELECT gen_random_uuid(), 'pan', 'PAN Card', now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.employee_document_type WHERE name = 'pan');
  END IF;
END $$;

-- ============================================
-- Default values for form_fields_type table
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'form_fields_type'
  ) THEN
    -- Insert text_input
    INSERT INTO public.form_fields_type (id, name, key, active, created_at, updated_at)
    SELECT gen_random_uuid(), 'Text Input', 'text_input', true, now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.form_fields_type WHERE key = 'text_input');

    -- Insert file_attachment
    INSERT INTO public.form_fields_type (id, name, key, active, created_at, updated_at)
    SELECT gen_random_uuid(), 'File Attachment', 'file_attachment', true, now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.form_fields_type WHERE key = 'file_attachment');

    -- Insert checkboxes
    INSERT INTO public.form_fields_type (id, name, key, active, created_at, updated_at)
    SELECT gen_random_uuid(), 'Checkboxes', 'checkboxes', true, now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.form_fields_type WHERE key = 'checkboxes');

    -- Insert dropdown
    INSERT INTO public.form_fields_type (id, name, key, active, created_at, updated_at)
    SELECT gen_random_uuid(), 'Dropdown', 'dropdown', true, now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.form_fields_type WHERE key = 'dropdown');

    -- Insert radio_buttons
    INSERT INTO public.form_fields_type (id, name, key, active, created_at, updated_at)
    SELECT gen_random_uuid(), 'Radio Buttons', 'radio_buttons', true, now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.form_fields_type WHERE key = 'radio_buttons');

    -- Insert rating
    INSERT INTO public.form_fields_type (id, name, key, active, created_at, updated_at)
    SELECT gen_random_uuid(), 'Rating', 'rating', true, now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.form_fields_type WHERE key = 'rating');

    -- Insert text_area
    INSERT INTO public.form_fields_type (id, name, key, active, created_at, updated_at)
    SELECT gen_random_uuid(), 'Text Area', 'text_area', true, now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.form_fields_type WHERE key = 'text_area');
  END IF;
END $$;

-- ============================================
-- Default values for incident_status table
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'incident_status'
  ) THEN
    -- Insert Open
    INSERT INTO public.incident_status (id, name, description, created_at, updated_at)
    SELECT gen_random_uuid(), 'Open', 'Incident is currently being investigated or resolved', now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.incident_status WHERE name = 'Open');

    -- Insert Closed
    INSERT INTO public.incident_status (id, name, description, created_at, updated_at)
    SELECT gen_random_uuid(), 'Closed', 'Incident has been resolved and closed', now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.incident_status WHERE name = 'Closed');
  END IF;
END $$;

-- ============================================
-- Default values for template_categories table
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'template_categories'
  ) THEN
    -- Insert Compliance
    INSERT INTO public.template_categories (id, name, description, created_at, updated_at)
    SELECT gen_random_uuid(), 'Compliance', 'Compliance and regulatory assessment templates', now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.template_categories WHERE name = 'Compliance');

    -- Insert Risk
    INSERT INTO public.template_categories (id, name, description, created_at, updated_at)
    SELECT gen_random_uuid(), 'Risk', 'Risk assessment and management templates', now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.template_categories WHERE name = 'Risk');

    -- Insert Safety
    INSERT INTO public.template_categories (id, name, description, created_at, updated_at)
    SELECT gen_random_uuid(), 'Safety', 'Safety-related assessment templates', now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.template_categories WHERE name = 'Safety');
  END IF;
END $$;

