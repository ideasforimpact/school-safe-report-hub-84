-- Insert default notification rules
-- This migration inserts default notification rules from production
-- IDs are auto-generated using gen_random_uuid() instead of hardcoded UUIDs

DO $$
BEGIN
  -- Only insert if table exists and no records exist yet
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notification_rules'
  ) THEN
    -- Insert default notification rules only if they don't already exist
    -- Check by module and type combination to avoid duplicates
    
    -- Assessment notification rules
    IF NOT EXISTS (SELECT 1 FROM public.notification_rules WHERE module = 'assessment' AND type = 'assessment_assigned') THEN
      INSERT INTO public.notification_rules (module, type, name, description, is_active, skip_conditions, created_at, updated_at)
      VALUES ('assessment', 'assessment_assigned', 'Assessment Assigned Notification', 'Send notification when an assessment is assigned to someone', true, '["self_action","inactive_user","no_email"]'::jsonb, now(), now());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.notification_rules WHERE module = 'assessment' AND type = 'assessment_submitted') THEN
      INSERT INTO public.notification_rules (module, type, name, description, is_active, skip_conditions, created_at, updated_at)
      VALUES ('assessment', 'assessment_submitted', 'Assessment Submitted Notification', 'Send notification when an assessment is submitted', true, '["self_action","inactive_user","no_email"]'::jsonb, now(), now());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.notification_rules WHERE module = 'assessment' AND type = 'assessment_completed') THEN
      INSERT INTO public.notification_rules (module, type, name, description, is_active, skip_conditions, created_at, updated_at)
      VALUES ('assessment', 'assessment_completed', 'Assessment Completed Notification', 'Send notification when an assessment is completed', true, '["self_action","inactive_user","no_email"]'::jsonb, now(), now());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.notification_rules WHERE module = 'assessment' AND type = 'assessment_rework_required') THEN
      INSERT INTO public.notification_rules (module, type, name, description, is_active, skip_conditions, created_at, updated_at)
      VALUES ('assessment', 'assessment_rework_required', 'Assessment Rework Required Notification', 'Send notification when assessment rework is required', true, '["self_action","inactive_user","no_email"]'::jsonb, now(), now());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.notification_rules WHERE module = 'assessment' AND type = 'assessment_due_5_days') THEN
      INSERT INTO public.notification_rules (module, type, name, description, is_active, skip_conditions, created_at, updated_at)
      VALUES ('assessment', 'assessment_due_5_days', 'Assessment Due Reminder Notification', 'Send reminder when assessment is due in 5 days', true, '["inactive_user","no_email","already_notified"]'::jsonb, now(), now());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.notification_rules WHERE module = 'assessment' AND type = 'assessment_overdue') THEN
      INSERT INTO public.notification_rules (module, type, name, description, is_active, skip_conditions, created_at, updated_at)
      VALUES ('assessment', 'assessment_overdue', 'Assessment Overdue Notification', 'Send notification when assessment is overdue', true, '["inactive_user","no_email","already_notified"]'::jsonb, now(), now());
    END IF;

    -- Incident notification rules
    IF NOT EXISTS (SELECT 1 FROM public.notification_rules WHERE module = 'incident' AND type = 'incident_assigned') THEN
      INSERT INTO public.notification_rules (module, type, name, description, is_active, skip_conditions, created_at, updated_at)
      VALUES ('incident', 'incident_assigned', 'Incident Assigned Notification', 'Send notification when an incident is assigned to someone', true, '["self_action","inactive_user","no_email"]'::jsonb, now(), now());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.notification_rules WHERE module = 'incident' AND type = 'incident_updated') THEN
      INSERT INTO public.notification_rules (module, type, name, description, is_active, skip_conditions, created_at, updated_at)
      VALUES ('incident', 'incident_updated', 'Incident Updated Notification', 'Send notification when an incident is updated', true, '["self_action","inactive_user","no_email"]'::jsonb, now(), now());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.notification_rules WHERE module = 'incident' AND type = 'incident_closed') THEN
      INSERT INTO public.notification_rules (module, type, name, description, is_active, skip_conditions, created_at, updated_at)
      VALUES ('incident', 'incident_closed', 'Incident Closed Notification', 'Send notification when an incident is closed', true, '["self_action","inactive_user","no_email"]'::jsonb, now(), now());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.notification_rules WHERE module = 'incident' AND type = 'incident_reopened') THEN
      INSERT INTO public.notification_rules (module, type, name, description, is_active, skip_conditions, created_at, updated_at)
      VALUES ('incident', 'incident_reopened', 'Incident Reopened Notification', 'Send notification when an incident is reopened', true, '["self_action","inactive_user","no_email"]'::jsonb, now(), now());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.notification_rules WHERE module = 'incident' AND type = 'incident_reminder_10_days') THEN
      INSERT INTO public.notification_rules (module, type, name, description, is_active, skip_conditions, created_at, updated_at)
      VALUES ('incident', 'incident_reminder_10_days', 'Incident Reminder Notification', 'Send reminder for incidents open for more than 10 days', true, '["inactive_user","no_email","already_notified"]'::jsonb, now(), now());
    END IF;

    -- Grievance notification rules
    IF NOT EXISTS (SELECT 1 FROM public.notification_rules WHERE module = 'grievance' AND type = 'grievance_submitted') THEN
      INSERT INTO public.notification_rules (module, type, name, description, is_active, skip_conditions, created_at, updated_at)
      VALUES ('grievance', 'grievance_submitted', 'Grievance Submitted Notification', 'Send notification when a grievance is submitted to all super admins and grievance admins', true, '[]'::jsonb, now(), now());
    END IF;

  END IF;
END $$;

