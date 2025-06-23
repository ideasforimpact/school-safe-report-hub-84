
-- Add client_id to incident_audit_log table and modify structure for JSON-based changes
ALTER TABLE public.incident_audit_log 
ADD COLUMN client_id UUID REFERENCES public.clients(id);

-- Add index for client_id
CREATE INDEX idx_incident_audit_log_client_id ON public.incident_audit_log(client_id);

-- Add a changes column to store JSON data instead of individual field changes
ALTER TABLE public.incident_audit_log 
ADD COLUMN changes JSONB DEFAULT '[]'::jsonb;

-- Update the log_incident_change function to handle JSON changes and client_id
CREATE OR REPLACE FUNCTION public.log_incident_change()
RETURNS TRIGGER AS $$
DECLARE
  changed_by_id UUID;
  incident_client_id UUID;
  changes_json JSONB := '[]'::jsonb;
  change_entry JSONB;
BEGIN
  -- Get the user who made the change and client_id
  changed_by_id := COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'sub')::uuid,
    NEW.created_by
  );
  
  -- Get client_id from the incident
  incident_client_id := NEW.client_id;

  -- Build changes JSON array
  IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
    change_entry := jsonb_build_object(
      'field', 'status_id',
      'old_value', OLD.status_id::text,
      'new_value', NEW.status_id::text,
      'description', 'Status changed'
    );
    changes_json := changes_json || change_entry;
  END IF;

  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    change_entry := jsonb_build_object(
      'field', 'assigned_to',
      'old_value', OLD.assigned_to::text,
      'new_value', NEW.assigned_to::text,
      'description', 'Assignment changed'
    );
    changes_json := changes_json || change_entry;
  END IF;

  IF OLD.priority_id IS DISTINCT FROM NEW.priority_id THEN
    change_entry := jsonb_build_object(
      'field', 'priority_id',
      'old_value', OLD.priority_id::text,
      'new_value', NEW.priority_id::text,
      'description', 'Priority changed'
    );
    changes_json := changes_json || change_entry;
  END IF;

  IF OLD.description IS DISTINCT FROM NEW.description THEN
    change_entry := jsonb_build_object(
      'field', 'description',
      'old_value', OLD.description,
      'new_value', NEW.description,
      'description', 'Description updated'
    );
    changes_json := changes_json || change_entry;
  END IF;

  IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN
    change_entry := jsonb_build_object(
      'field', 'category_id',
      'old_value', OLD.category_id::text,
      'new_value', NEW.category_id::text,
      'description', 'Category changed'
    );
    changes_json := changes_json || change_entry;
  END IF;

  IF OLD.subcategory_id IS DISTINCT FROM NEW.subcategory_id THEN
    change_entry := jsonb_build_object(
      'field', 'subcategory_id',
      'old_value', OLD.subcategory_id::text,
      'new_value', NEW.subcategory_id::text,
      'description', 'Subcategory changed'
    );
    changes_json := changes_json || change_entry;
  END IF;

  IF OLD.location_id IS DISTINCT FROM NEW.location_id THEN
    change_entry := jsonb_build_object(
      'field', 'location_id',
      'old_value', OLD.location_id::text,
      'new_value', NEW.location_id::text,
      'description', 'Location changed'
    );
    changes_json := changes_json || change_entry;
  END IF;

  IF OLD.facility_id IS DISTINCT FROM NEW.facility_id THEN
    change_entry := jsonb_build_object(
      'field', 'facility_id',
      'old_value', OLD.facility_id::text,
      'new_value', NEW.facility_id::text,
      'description', 'Facility changed'
    );
    changes_json := changes_json || change_entry;
  END IF;

  IF OLD.type_id IS DISTINCT FROM NEW.type_id THEN
    change_entry := jsonb_build_object(
      'field', 'type_id',
      'old_value', OLD.type_id::text,
      'new_value', NEW.type_id::text,
      'description', 'Type changed'
    );
    changes_json := changes_json || change_entry;
  END IF;

  IF OLD.root_cause_analysis IS DISTINCT FROM NEW.root_cause_analysis THEN
    change_entry := jsonb_build_object(
      'field', 'root_cause_analysis',
      'old_value', OLD.root_cause_analysis,
      'new_value', NEW.root_cause_analysis,
      'description', 'Root cause analysis updated'
    );
    changes_json := changes_json || change_entry;
  END IF;

  IF OLD.action_taken IS DISTINCT FROM NEW.action_taken THEN
    change_entry := jsonb_build_object(
      'field', 'action_taken',
      'old_value', OLD.action_taken,
      'new_value', NEW.action_taken,
      'description', 'Action taken updated'
    );
    changes_json := changes_json || change_entry;
  END IF;

  -- Only insert if there are actual changes
  IF jsonb_array_length(changes_json) > 0 THEN
    INSERT INTO public.incident_audit_log (
      incident_id, 
      client_id,
      field_changed, 
      changed_by, 
      change_type, 
      description,
      changes
    )
    VALUES (
      NEW.id, 
      incident_client_id,
      'multiple_fields', 
      changed_by_id, 
      'field_update',
      'Incident updated',
      changes_json
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the insert_incident_audit_log function to include client_id
CREATE OR REPLACE FUNCTION public.insert_incident_audit_log(
  p_incident_id UUID,
  p_client_id UUID,
  p_field_changed TEXT,
  p_changed_by UUID,
  p_old_value TEXT DEFAULT NULL,
  p_new_value TEXT DEFAULT NULL,
  p_change_type TEXT DEFAULT 'action',
  p_description TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.incident_audit_log (
    incident_id, 
    client_id,
    field_changed, 
    old_value, 
    new_value, 
    changed_by, 
    change_type, 
    description,
    changes
  )
  VALUES (
    p_incident_id, 
    p_client_id,
    p_field_changed, 
    p_old_value, 
    p_new_value, 
    p_changed_by, 
    p_change_type, 
    p_description,
    p_changes
  )
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql;
