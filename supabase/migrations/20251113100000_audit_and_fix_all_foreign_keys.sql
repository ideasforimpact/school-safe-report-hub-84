-- Comprehensive Foreign Key Audit and Fix
-- This migration ensures ALL foreign key relationships exist for PostgREST nested selects
-- Checks all 42+ tables and ensures foreign keys are properly defined

DO $$
DECLARE
  missing_fk_count INTEGER := 0;
  fixed_fk_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== Starting Foreign Key Audit ===';
  
  -- ============================================
  -- 1. client_modules -> modules
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='client_modules')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='modules') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'client_modules_module_id_fkey'
      AND conrelid = 'public.client_modules'::regclass
    ) THEN
      ALTER TABLE public.client_modules
        ADD CONSTRAINT client_modules_module_id_fkey
        FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;
      fixed_fk_count := fixed_fk_count + 1;
      RAISE NOTICE 'FIXED: client_modules.module_id -> modules.id';
    END IF;
  END IF;

  -- ============================================
  -- 2. employee_modules -> modules
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employee_modules')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='modules') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'employee_modules_module_id_fkey'
      AND conrelid = 'public.employee_modules'::regclass
    ) THEN
      ALTER TABLE public.employee_modules
        ADD CONSTRAINT employee_modules_module_id_fkey
        FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;
      fixed_fk_count := fixed_fk_count + 1;
      RAISE NOTICE 'FIXED: employee_modules.module_id -> modules.id';
    END IF;
  END IF;

  -- ============================================
  -- 3. assessments -> assessment_templates
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='assessments')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='assessment_templates') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'assessments_template_id_fkey'
      AND conrelid = 'public.assessments'::regclass
    ) THEN
      ALTER TABLE public.assessments
        ADD CONSTRAINT assessments_template_id_fkey
        FOREIGN KEY (template_id) REFERENCES public.assessment_templates(id) ON DELETE CASCADE;
      fixed_fk_count := fixed_fk_count + 1;
      RAISE NOTICE 'FIXED: assessments.template_id -> assessment_templates.id';
    END IF;
  END IF;

  -- ============================================
  -- 4. assessment_templates -> template_categories
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='assessment_templates')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='template_categories') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'assessment_templates_category_id_fkey'
      AND conrelid = 'public.assessment_templates'::regclass
    ) THEN
      ALTER TABLE public.assessment_templates
        ADD CONSTRAINT assessment_templates_category_id_fkey
        FOREIGN KEY (category_id) REFERENCES public.template_categories(id) ON DELETE CASCADE;
      fixed_fk_count := fixed_fk_count + 1;
      RAISE NOTICE 'FIXED: assessment_templates.category_id -> template_categories.id';
    END IF;
  END IF;

  -- ============================================
  -- 5. form_submissions -> custom_forms
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='form_submissions')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='custom_forms') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'form_submissions_form_id_fkey'
      AND conrelid = 'public.form_submissions'::regclass
    ) THEN
      ALTER TABLE public.form_submissions
        ADD CONSTRAINT form_submissions_form_id_fkey
        FOREIGN KEY (form_id) REFERENCES public.custom_forms(id) ON DELETE CASCADE;
      fixed_fk_count := fixed_fk_count + 1;
      RAISE NOTICE 'FIXED: form_submissions.form_id -> custom_forms.id';
    END IF;
  END IF;

  -- ============================================
  -- 6. incident_subcategories -> incident_categories
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='incident_subcategories')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='incident_categories') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'incident_subcategories_category_id_fkey'
      AND conrelid = 'public.incident_subcategories'::regclass
    ) THEN
      ALTER TABLE public.incident_subcategories
        ADD CONSTRAINT incident_subcategories_category_id_fkey
        FOREIGN KEY (category_id) REFERENCES public.incident_categories(id) ON DELETE CASCADE;
      fixed_fk_count := fixed_fk_count + 1;
      RAISE NOTICE 'FIXED: incident_subcategories.category_id -> incident_categories.id';
    END IF;
  END IF;

  -- ============================================
  -- 7. sections -> grades
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sections')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='grades') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'sections_grade_id_fkey'
      AND conrelid = 'public.sections'::regclass
    ) THEN
      ALTER TABLE public.sections
        ADD CONSTRAINT sections_grade_id_fkey
        FOREIGN KEY (grade_id) REFERENCES public.grades(id) ON DELETE CASCADE;
      fixed_fk_count := fixed_fk_count + 1;
      RAISE NOTICE 'FIXED: sections.grade_id -> grades.id';
    END IF;
  END IF;

  -- ============================================
  -- 8. grades -> campuses
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='grades')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='campuses') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'grades_campus_id_fkey'
      AND conrelid = 'public.grades'::regclass
    ) THEN
      ALTER TABLE public.grades
        ADD CONSTRAINT grades_campus_id_fkey
        FOREIGN KEY (campus_id) REFERENCES public.campuses(id) ON DELETE CASCADE;
      fixed_fk_count := fixed_fk_count + 1;
      RAISE NOTICE 'FIXED: grades.campus_id -> campuses.id';
    END IF;
  END IF;

  -- ============================================
  -- 9. facilities -> campuses
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='facilities')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='campuses') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'facilities_campus_id_fkey'
      AND conrelid = 'public.facilities'::regclass
    ) THEN
      ALTER TABLE public.facilities
        ADD CONSTRAINT facilities_campus_id_fkey
        FOREIGN KEY (campus_id) REFERENCES public.campuses(id) ON DELETE CASCADE;
      fixed_fk_count := fixed_fk_count + 1;
      RAISE NOTICE 'FIXED: facilities.campus_id -> campuses.id';
    END IF;
  END IF;

  -- ============================================
  -- 10. vehicle_documents -> vehicles
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='vehicle_documents')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='vehicles') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'vehicle_documents_vehicle_id_fkey'
      AND conrelid = 'public.vehicle_documents'::regclass
    ) THEN
      ALTER TABLE public.vehicle_documents
        ADD CONSTRAINT vehicle_documents_vehicle_id_fkey
        FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;
      fixed_fk_count := fixed_fk_count + 1;
      RAISE NOTICE 'FIXED: vehicle_documents.vehicle_id -> vehicles.id';
    END IF;
  END IF;

  -- ============================================
  -- 11. employee_documents -> employee_document_type
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employee_documents')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employee_document_type') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'employee_documents_document_type_id_fkey'
      AND conrelid = 'public.employee_documents'::regclass
    ) THEN
      ALTER TABLE public.employee_documents
        ADD CONSTRAINT employee_documents_document_type_id_fkey
        FOREIGN KEY (document_type_id) REFERENCES public.employee_document_type(id) ON DELETE CASCADE;
      fixed_fk_count := fixed_fk_count + 1;
      RAISE NOTICE 'FIXED: employee_documents.document_type_id -> employee_document_type.id';
    END IF;
  END IF;

  -- ============================================
  -- 12. employee_documents -> document_status
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employee_documents')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='document_status') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'employee_documents_document_status_id_fkey'
      AND conrelid = 'public.employee_documents'::regclass
    ) THEN
      ALTER TABLE public.employee_documents
        ADD CONSTRAINT employee_documents_document_status_id_fkey
        FOREIGN KEY (document_status_id) REFERENCES public.document_status(id) ON DELETE CASCADE;
      fixed_fk_count := fixed_fk_count + 1;
      RAISE NOTICE 'FIXED: employee_documents.document_status_id -> document_status.id';
    END IF;
  END IF;

  -- ============================================
  -- 13. notification_logs -> email_queue
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='notification_logs')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='email_queue') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'notification_logs_email_queue_id_fkey'
      AND conrelid = 'public.notification_logs'::regclass
    ) THEN
      ALTER TABLE public.notification_logs
        ADD CONSTRAINT notification_logs_email_queue_id_fkey
        FOREIGN KEY (email_queue_id) REFERENCES public.email_queue(id) ON DELETE CASCADE;
      fixed_fk_count := fixed_fk_count + 1;
      RAISE NOTICE 'FIXED: notification_logs.email_queue_id -> email_queue.id';
    END IF;
  END IF;

  -- ============================================
  -- 14. backoffice_edusafe_resource -> client_type
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='backoffice_edusafe_resource')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='client_type') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'backoffice_edusafe_resource_client_type_id_fkey'
      AND conrelid = 'public.backoffice_edusafe_resource'::regclass
    ) THEN
      ALTER TABLE public.backoffice_edusafe_resource
        ADD CONSTRAINT backoffice_edusafe_resource_client_type_id_fkey
        FOREIGN KEY (client_type_id) REFERENCES public.client_type(id) ON DELETE CASCADE;
      fixed_fk_count := fixed_fk_count + 1;
      RAISE NOTICE 'FIXED: backoffice_edusafe_resource.client_type_id -> client_type.id';
    END IF;
  END IF;

  -- ============================================
  -- 15. incidents -> incident_report_types (type_id)
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='incidents')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='incident_report_types') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'incidents_type_id_fkey'
      AND conrelid = 'public.incidents'::regclass
    ) THEN
      ALTER TABLE public.incidents
        ADD CONSTRAINT incidents_type_id_fkey
        FOREIGN KEY (type_id) REFERENCES public.incident_report_types(id) ON DELETE SET NULL;
      fixed_fk_count := fixed_fk_count + 1;
      RAISE NOTICE 'FIXED: incidents.type_id -> incident_report_types.id';
    END IF;
  END IF;

  -- ============================================
  -- 16. incidents -> incident_categories (category_id)
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='incidents')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='incident_categories') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'incidents_category_id_fkey'
      AND conrelid = 'public.incidents'::regclass
    ) THEN
      ALTER TABLE public.incidents
        ADD CONSTRAINT incidents_category_id_fkey
        FOREIGN KEY (category_id) REFERENCES public.incident_categories(id) ON DELETE SET NULL;
      fixed_fk_count := fixed_fk_count + 1;
      RAISE NOTICE 'FIXED: incidents.category_id -> incident_categories.id';
    END IF;
  END IF;

  -- ============================================
  -- 17. incidents -> incident_subcategories (subcategory_id)
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='incidents')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='incident_subcategories') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'incidents_subcategory_id_fkey'
      AND conrelid = 'public.incidents'::regclass
    ) THEN
      ALTER TABLE public.incidents
        ADD CONSTRAINT incidents_subcategory_id_fkey
        FOREIGN KEY (subcategory_id) REFERENCES public.incident_subcategories(id) ON DELETE SET NULL;
      fixed_fk_count := fixed_fk_count + 1;
      RAISE NOTICE 'FIXED: incidents.subcategory_id -> incident_subcategories.id';
    END IF;
  END IF;

  -- ============================================
  -- 18. incidents -> campuses (location_id)
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='incidents')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='campuses') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'incidents_location_id_fkey'
      AND conrelid = 'public.incidents'::regclass
    ) THEN
      ALTER TABLE public.incidents
        ADD CONSTRAINT incidents_location_id_fkey
        FOREIGN KEY (location_id) REFERENCES public.campuses(id) ON DELETE SET NULL;
      fixed_fk_count := fixed_fk_count + 1;
      RAISE NOTICE 'FIXED: incidents.location_id -> campuses.id';
    END IF;
  END IF;

  -- ============================================
  -- 19. incidents -> facilities (facility_id)
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='incidents')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='facilities') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'incidents_facility_id_fkey'
      AND conrelid = 'public.incidents'::regclass
    ) THEN
      ALTER TABLE public.incidents
        ADD CONSTRAINT incidents_facility_id_fkey
        FOREIGN KEY (facility_id) REFERENCES public.facilities(id) ON DELETE SET NULL;
      fixed_fk_count := fixed_fk_count + 1;
      RAISE NOTICE 'FIXED: incidents.facility_id -> facilities.id';
    END IF;
  END IF;

  -- ============================================
  -- 20. incidents -> incident_priorities (priority_id)
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='incidents')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='incident_priorities') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'incidents_priority_id_fkey'
      AND conrelid = 'public.incidents'::regclass
    ) THEN
      ALTER TABLE public.incidents
        ADD CONSTRAINT incidents_priority_id_fkey
        FOREIGN KEY (priority_id) REFERENCES public.incident_priorities(id) ON DELETE SET NULL;
      fixed_fk_count := fixed_fk_count + 1;
      RAISE NOTICE 'FIXED: incidents.priority_id -> incident_priorities.id';
    END IF;
  END IF;

  -- ============================================
  -- 21. incidents -> incident_status (status_id)
  -- NOTE: This FK is already created in create_incidents.sql as 'fk_incident_status'
  -- Removing duplicate creation to avoid PostgREST relationship conflicts
  -- ============================================
  -- FK constraint 'fk_incident_status' is created in create_incidents.sql migration
  -- No need to create it here to avoid duplicate FK constraints

  -- ============================================
  -- 22. assessments -> employees (completed_by)
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='assessments')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employees') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'assessments_completed_by_fkey'
      AND conrelid = 'public.assessments'::regclass
    ) THEN
      ALTER TABLE public.assessments
        ADD CONSTRAINT assessments_completed_by_fkey
        FOREIGN KEY (completed_by) REFERENCES public.employees(id) ON DELETE SET NULL;
      fixed_fk_count := fixed_fk_count + 1;
      RAISE NOTICE 'FIXED: assessments.completed_by -> employees.id';
    END IF;
  END IF;

  -- ============================================
  -- Summary
  -- ============================================
  RAISE NOTICE '=== Foreign Key Audit Complete ===';
  RAISE NOTICE 'Foreign keys fixed: %', fixed_fk_count;
  
  IF fixed_fk_count > 0 THEN
    RAISE NOTICE 'PostgREST schema cache will be refreshed automatically';
  END IF;
END $$;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

