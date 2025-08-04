-- Enable RLS on remaining tables to fix all security issues
-- These tables contain sensitive data and should be protected

-- System/configuration tables
ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_document_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edusafe_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backoffice_edusafe_resource ENABLE ROW LEVEL SECURITY;