-- Create all database triggers from migrations_copy
-- This migration consolidates all trigger definitions that exist in production

-- ============================================
-- Assessment Triggers
-- ============================================
-- Trigger for assessment changes (audit logging)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'assessments'
  ) THEN
    DROP TRIGGER IF EXISTS assessment_audit_trigger ON public.assessments;
    CREATE TRIGGER assessment_audit_trigger
      AFTER UPDATE ON public.assessments
      FOR EACH ROW
      EXECUTE FUNCTION public.log_assessment_change();
  END IF;
END $$;

-- Trigger for assessment creation (audit logging)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'assessments'
  ) THEN
    DROP TRIGGER IF EXISTS assessment_creation_audit_trigger ON public.assessments;
    CREATE TRIGGER assessment_creation_audit_trigger
      AFTER INSERT ON public.assessments
      FOR EACH ROW
      EXECUTE FUNCTION public.log_assessment_creation();
  END IF;
END $$;

-- Trigger to update assessments updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'assessments'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'assessments' AND column_name = 'updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS update_assessments_updated_at ON public.assessments;
    CREATE TRIGGER update_assessments_updated_at
      BEFORE UPDATE ON public.assessments
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- Assessment Templates Triggers
-- ============================================
-- Trigger to update assessment_templates updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'assessment_templates'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'assessment_templates' AND column_name = 'updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS update_assessment_templates_updated_at ON public.assessment_templates;
    CREATE TRIGGER update_assessment_templates_updated_at
      BEFORE UPDATE ON public.assessment_templates
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- Employee Triggers
-- ============================================
-- Trigger to clean employee email (remove whitespace)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'employees'
  ) THEN
    DROP TRIGGER IF EXISTS clean_employee_email_trigger ON public.employees;
    CREATE TRIGGER clean_employee_email_trigger
      BEFORE INSERT OR UPDATE ON public.employees
      FOR EACH ROW
      EXECUTE FUNCTION public.clean_employee_email();
  END IF;
END $$;

-- ============================================
-- Incident Triggers
-- ============================================
-- Trigger to log incident changes (audit logging)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'incidents'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_log_incident_changes ON public.incidents;
    CREATE TRIGGER trigger_log_incident_changes
      AFTER UPDATE ON public.incidents
      FOR EACH ROW
      EXECUTE FUNCTION public.log_incident_change();
  END IF;
END $$;

-- Trigger to update incidents updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'incidents'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'incidents' AND column_name = 'updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS update_incidents_updated_at ON public.incidents;
    CREATE TRIGGER update_incidents_updated_at
      BEFORE UPDATE ON public.incidents
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- Form Submission Triggers
-- ============================================
-- Trigger to auto-populate client_id from custom_forms
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'form_submissions'
  ) THEN
    DROP TRIGGER IF EXISTS trg_set_form_submission_client_id ON public.form_submissions;
    CREATE TRIGGER trg_set_form_submission_client_id
      BEFORE INSERT ON public.form_submissions
      FOR EACH ROW
      EXECUTE FUNCTION public.set_form_submission_client_id();
  END IF;
END $$;

-- ============================================
-- Compliance Documents Triggers
-- ============================================
-- Trigger to update compliance_documents updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'compliance_documents'
  ) THEN
    DROP TRIGGER IF EXISTS trg_compliance_documents_updated_at ON public.compliance_documents;
    CREATE TRIGGER trg_compliance_documents_updated_at
      BEFORE UPDATE ON public.compliance_documents
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ============================================
-- Email Queue Triggers
-- ============================================
-- Trigger to update email_queue updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'email_queue'
  ) THEN
    DROP TRIGGER IF EXISTS update_email_queue_updated_at ON public.email_queue;
    CREATE TRIGGER update_email_queue_updated_at
      BEFORE UPDATE ON public.email_queue
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- Notification System Triggers
-- ============================================
-- Trigger to update notification_templates updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notification_templates'
  ) THEN
    DROP TRIGGER IF EXISTS update_notification_templates_updated_at ON public.notification_templates;
    CREATE TRIGGER update_notification_templates_updated_at
      BEFORE UPDATE ON public.notification_templates
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Trigger to update notification_rules updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notification_rules'
  ) THEN
    DROP TRIGGER IF EXISTS update_notification_rules_updated_at ON public.notification_rules;
    CREATE TRIGGER update_notification_rules_updated_at
      BEFORE UPDATE ON public.notification_rules
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- Backoffice Users Triggers
-- ============================================
-- Trigger to update backoffice_users updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'backoffice_users'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'backoffice_users' AND column_name = 'updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS update_backoffice_users_updated_at_trigger ON public.backoffice_users;
    CREATE TRIGGER update_backoffice_users_updated_at_trigger
      BEFORE UPDATE ON public.backoffice_users
      FOR EACH ROW
      EXECUTE FUNCTION public.update_backoffice_users_updated_at();
  END IF;
END $$;

-- ============================================
-- Other Table Triggers (updated_at)
-- ============================================
-- Trigger to update campuses updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'campuses'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'campuses' AND column_name = 'updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS update_campuses_updated_at ON public.campuses;
    CREATE TRIGGER update_campuses_updated_at
      BEFORE UPDATE ON public.campuses
      FOR EACH ROW
      EXECUTE FUNCTION public.update_modified_column();
  END IF;
END $$;

-- Trigger to update facilities updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'facilities'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'facilities' AND column_name = 'updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS update_facilities_updated_at ON public.facilities;
    CREATE TRIGGER update_facilities_updated_at
      BEFORE UPDATE ON public.facilities
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Trigger to update grades updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'grades'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'grades' AND column_name = 'updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS update_grades_updated_at ON public.grades;
    CREATE TRIGGER update_grades_updated_at
      BEFORE UPDATE ON public.grades
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Trigger to update incident_categories updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'incident_categories'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'incident_categories' AND column_name = 'updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS update_incident_categories_updated_at ON public.incident_categories;
    CREATE TRIGGER update_incident_categories_updated_at
      BEFORE UPDATE ON public.incident_categories
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Trigger to update incident_subcategories updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'incident_subcategories'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'incident_subcategories' AND column_name = 'updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS update_incident_subcategories_updated_at ON public.incident_subcategories;
    CREATE TRIGGER update_incident_subcategories_updated_at
      BEFORE UPDATE ON public.incident_subcategories
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Trigger to update sections updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'sections'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sections' AND column_name = 'updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS update_sections_updated_at ON public.sections;
    CREATE TRIGGER update_sections_updated_at
      BEFORE UPDATE ON public.sections
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Trigger to update template_categories updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'template_categories'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'template_categories' AND column_name = 'updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS update_template_categories_updated_at ON public.template_categories;
    CREATE TRIGGER update_template_categories_updated_at
      BEFORE UPDATE ON public.template_categories
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- Contributing Factors Triggers
-- ============================================
-- Trigger to update contributing_factors updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'contributing_factors'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contributing_factors' AND column_name = 'updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS set_timestamp_contributing_factors ON public.contributing_factors;
    CREATE TRIGGER set_timestamp_contributing_factors
      BEFORE UPDATE ON public.contributing_factors
      FOR EACH ROW
      EXECUTE FUNCTION public.update_modified_column();
  END IF;
END $$;

-- ============================================
-- Vehicle and Vehicle Documents Triggers
-- ============================================
-- Trigger to update vehicles updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'vehicles'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS set_updated_at ON public.vehicles;
    CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON public.vehicles
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Trigger to update vehicle_documents updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'vehicle_documents'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vehicle_documents' AND column_name = 'updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS set_updated_at ON public.vehicle_documents;
    CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON public.vehicle_documents
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- Employee Documents Triggers
-- ============================================
-- Trigger to update employee_documents updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'employee_documents'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employee_documents' AND column_name = 'updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS set_updated_at ON public.employee_documents;
    CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON public.employee_documents
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

