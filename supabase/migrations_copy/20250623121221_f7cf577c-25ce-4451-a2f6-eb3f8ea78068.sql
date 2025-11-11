
-- Create the incident_audit_log table to track all incident changes
CREATE TABLE IF NOT EXISTS public.incident_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL,
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  change_type TEXT NOT NULL DEFAULT 'update',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraint to incidents table
-- This migration is conditional to avoid errors if tables don't exist yet
DO $$
BEGIN
  -- Check if both tables exist
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'incident_audit_log'
  ) AND EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'incidents'
  ) THEN
    -- Check if constraint doesn't already exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.table_constraints 
      WHERE table_schema = 'public' 
      AND table_name = 'incident_audit_log' 
      AND constraint_name = 'fk_incident_audit_log_incident_id'
    ) THEN
      ALTER TABLE public.incident_audit_log 
      ADD CONSTRAINT fk_incident_audit_log_incident_id 
      FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_incident_audit_log_incident_id ON public.incident_audit_log(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_audit_log_changed_at ON public.incident_audit_log(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_incident_audit_log_changed_by ON public.incident_audit_log(changed_by);

-- Disable RLS on this table as requested
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'incident_audit_log') THEN
    ALTER TABLE public.incident_audit_log DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create a function to log incident changes
CREATE OR REPLACE FUNCTION public.log_incident_change()
RETURNS TRIGGER AS $$
DECLARE
  changed_by_id UUID;
BEGIN
  -- Get the user who made the change (from auth context or updated_at trigger)
  changed_by_id := COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'sub')::uuid,
    NEW.created_by
  );

  -- Track specific field changes
  IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
    INSERT INTO public.incident_audit_log (incident_id, field_changed, old_value, new_value, changed_by, change_type, description)
    VALUES (
      NEW.id, 
      'status_id', 
      OLD.status_id::text, 
      NEW.status_id::text, 
      changed_by_id, 
      'field_update',
      'Status changed'
    );
  END IF;

  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO public.incident_audit_log (incident_id, field_changed, old_value, new_value, changed_by, change_type, description)
    VALUES (
      NEW.id, 
      'assigned_to', 
      OLD.assigned_to::text, 
      NEW.assigned_to::text, 
      changed_by_id, 
      'field_update',
      'Assignment changed'
    );
  END IF;

  IF OLD.priority_id IS DISTINCT FROM NEW.priority_id THEN
    INSERT INTO public.incident_audit_log (incident_id, field_changed, old_value, new_value, changed_by, change_type, description)
    VALUES (
      NEW.id, 
      'priority_id', 
      OLD.priority_id::text, 
      NEW.priority_id::text, 
      changed_by_id, 
      'field_update',
      'Priority changed'
    );
  END IF;

  IF OLD.description IS DISTINCT FROM NEW.description THEN
    INSERT INTO public.incident_audit_log (incident_id, field_changed, old_value, new_value, changed_by, change_type, description)
    VALUES (
      NEW.id, 
      'description', 
      OLD.description, 
      NEW.description, 
      changed_by_id, 
      'field_update',
      'Description updated'
    );
  END IF;

  IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN
    INSERT INTO public.incident_audit_log (incident_id, field_changed, old_value, new_value, changed_by, change_type, description)
    VALUES (
      NEW.id, 
      'category_id', 
      OLD.category_id::text, 
      NEW.category_id::text, 
      changed_by_id, 
      'field_update',
      'Category changed'
    );
  END IF;

  IF OLD.subcategory_id IS DISTINCT FROM NEW.subcategory_id THEN
    INSERT INTO public.incident_audit_log (incident_id, field_changed, old_value, new_value, changed_by, change_type, description)
    VALUES (
      NEW.id, 
      'subcategory_id', 
      OLD.subcategory_id::text, 
      NEW.subcategory_id::text, 
      changed_by_id, 
      'field_update',
      'Subcategory changed'
    );
  END IF;

  IF OLD.location_id IS DISTINCT FROM NEW.location_id THEN
    INSERT INTO public.incident_audit_log (incident_id, field_changed, old_value, new_value, changed_by, change_type, description)
    VALUES (
      NEW.id, 
      'location_id', 
      OLD.location_id::text, 
      NEW.location_id::text, 
      changed_by_id, 
      'field_update',
      'Location changed'
    );
  END IF;

  IF OLD.facility_id IS DISTINCT FROM NEW.facility_id THEN
    INSERT INTO public.incident_audit_log (incident_id, field_changed, old_value, new_value, changed_by, change_type, description)
    VALUES (
      NEW.id, 
      'facility_id', 
      OLD.facility_id::text, 
      NEW.facility_id::text, 
      changed_by_id, 
      'field_update',
      'Facility changed'
    );
  END IF;

  IF OLD.type_id IS DISTINCT FROM NEW.type_id THEN
    INSERT INTO public.incident_audit_log (incident_id, field_changed, old_value, new_value, changed_by, change_type, description)
    VALUES (
      NEW.id, 
      'type_id', 
      OLD.type_id::text, 
      NEW.type_id::text, 
      changed_by_id, 
      'field_update',
      'Type changed'
    );
  END IF;

  IF OLD.root_cause_analysis IS DISTINCT FROM NEW.root_cause_analysis THEN
    INSERT INTO public.incident_audit_log (incident_id, field_changed, old_value, new_value, changed_by, change_type, description)
    VALUES (
      NEW.id, 
      'root_cause_analysis', 
      OLD.root_cause_analysis, 
      NEW.root_cause_analysis, 
      changed_by_id, 
      'field_update',
      'Root cause analysis updated'
    );
  END IF;

  IF OLD.action_taken IS DISTINCT FROM NEW.action_taken THEN
    INSERT INTO public.incident_audit_log (incident_id, field_changed, old_value, new_value, changed_by, change_type, description)
    VALUES (
      NEW.id, 
      'action_taken', 
      OLD.action_taken, 
      NEW.action_taken, 
      changed_by_id, 
      'field_update',
      'Action taken updated'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically log incident changes
-- This is conditional to avoid errors if the incidents table doesn't exist yet
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'incidents'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_log_incident_changes ON public.incidents;
    CREATE TRIGGER trigger_log_incident_changes
      AFTER UPDATE ON public.incidents
      FOR EACH ROW
      EXECUTE FUNCTION public.log_incident_change();
  END IF;
END $$;

-- Function to manually log audit entries (for comments, documents, etc.) - Fixed parameter defaults
CREATE OR REPLACE FUNCTION public.insert_incident_audit_log(
  p_incident_id UUID,
  p_field_changed TEXT,
  p_changed_by UUID,
  p_old_value TEXT DEFAULT NULL,
  p_new_value TEXT DEFAULT NULL,
  p_change_type TEXT DEFAULT 'action',
  p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.incident_audit_log (
    incident_id, 
    field_changed, 
    old_value, 
    new_value, 
    changed_by, 
    change_type, 
    description
  )
  VALUES (
    p_incident_id, 
    p_field_changed, 
    p_old_value, 
    p_new_value, 
    p_changed_by, 
    p_change_type, 
    p_description
  )
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql;
