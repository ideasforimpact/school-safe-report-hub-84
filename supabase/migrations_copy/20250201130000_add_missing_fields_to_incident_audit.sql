-- Add missing fields to incident audit log trigger
-- This migration adds tracking for 'date', 'people_involved', and 'documents' fields

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

  -- ADD MISSING FIELD: Date and time tracking
  IF OLD.date IS DISTINCT FROM NEW.date THEN
    change_entry := jsonb_build_object(
      'field', 'date',
      'old_value', OLD.date::text,
      'new_value', NEW.date::text,
      'description', 'Date and time changed'
    );
    changes_json := changes_json || change_entry;
  END IF;

  -- ADD MISSING FIELD: People involved tracking
  IF OLD.people_involved IS DISTINCT FROM NEW.people_involved THEN
    change_entry := jsonb_build_object(
      'field', 'people_involved',
      'old_value', COALESCE(OLD.people_involved::text, '[]'),
      'new_value', COALESCE(NEW.people_involved::text, '[]'),
      'description', 'People involved updated'
    );
    changes_json := changes_json || change_entry;
  END IF;

  -- ADD MISSING FIELD: Supporting documents tracking
  IF OLD.documents IS DISTINCT FROM NEW.documents THEN
    change_entry := jsonb_build_object(
      'field', 'documents',
      'old_value', COALESCE(OLD.documents::text, '[]'),
      'new_value', COALESCE(NEW.documents::text, '[]'),
      'description', 'Supporting documents updated'
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
