-- Insert default modules from modules_rows.csv
-- This migration inserts default module values, checking for duplicates based on level and name

DO $$
DECLARE
  module_record RECORD;
  existing_count integer;
BEGIN
  -- Check if modules table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'modules'
  ) THEN
    
    -- Insert module records from CSV data
    -- Each INSERT checks if a row with the same level and name already exists
    
    -- 1. Forms (backoffice)
    SELECT COUNT(*) INTO existing_count 
    FROM public.modules 
    WHERE level = 'backoffice' AND name = 'Forms';
    IF existing_count = 0 THEN
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES ('Forms', 'backoffice', 'Forms', '2025-08-12 12:49:02.186217+00'::timestamptz, '2025-10-29 16:54:08.301+00'::timestamptz, NULL, '/backoffice/forms', true);
    END IF;

    -- 2. Users (user)
    SELECT COUNT(*) INTO existing_count 
    FROM public.modules 
    WHERE level = 'user' AND name = 'Users';
    IF existing_count = 0 THEN
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES ('Users', 'user', 'Users', '2025-05-18 17:00:02.311079+00'::timestamptz, '2025-05-28 11:54:00.173+00'::timestamptz, 9, '/users', true);
    END IF;

    -- 3. Assessments (user)
    SELECT COUNT(*) INTO existing_count 
    FROM public.modules 
    WHERE level = 'user' AND name = 'Assessments';
    IF existing_count = 0 THEN
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES ('Assessments', 'user', 'ClipboardCheck', '2025-05-18 17:00:02.311079+00'::timestamptz, '2025-05-28 11:52:41.917+00'::timestamptz, 3, '/assessments', true);
    END IF;

    -- 4. Clients (backoffice)
    SELECT COUNT(*) INTO existing_count 
    FROM public.modules 
    WHERE level = 'backoffice' AND name = 'Clients';
    IF existing_count = 0 THEN
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES ('Clients', 'backoffice', 'Building2', '2025-05-18 17:00:02.311079+00'::timestamptz, '2025-05-28 11:36:51.262+00'::timestamptz, 2, '/clients', true);
    END IF;

    -- 5. Settings (user)
    SELECT COUNT(*) INTO existing_count 
    FROM public.modules 
    WHERE level = 'user' AND name = 'Settings';
    IF existing_count = 0 THEN
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES ('Settings', 'user', 'Settings', '2025-05-18 17:00:02.311079+00'::timestamptz, '2025-05-28 11:54:06.123+00'::timestamptz, 10, '/settings', true);
    END IF;

    -- 6. Verification (backoffice)
    SELECT COUNT(*) INTO existing_count 
    FROM public.modules 
    WHERE level = 'backoffice' AND name = 'Verification';
    IF existing_count = 0 THEN
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES ('Verification', 'backoffice', 'UserCheck', '2025-06-12 05:14:45.701107+00'::timestamptz, '2025-06-12 05:36:18.957+00'::timestamptz, 7, '/backoffice-employee-verification', true);
    END IF;

    -- 7. Grievances (user)
    SELECT COUNT(*) INTO existing_count 
    FROM public.modules 
    WHERE level = 'user' AND name = 'Grievances';
    IF existing_count = 0 THEN
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES ('Grievances', 'user', 'FileText', '2025-05-27 09:29:05.862016+00'::timestamptz, '2025-08-20 15:02:42.936+00'::timestamptz, 8, '/forms', true);
    END IF;

    -- 8. Settings (backoffice)
    SELECT COUNT(*) INTO existing_count 
    FROM public.modules 
    WHERE level = 'backoffice' AND name = 'Settings';
    IF existing_count = 0 THEN
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES ('Settings', 'backoffice', 'Settings', '2025-05-18 17:00:02.311079+00'::timestamptz, '2025-06-28 06:37:39.968+00'::timestamptz, 7, '/settings', false);
    END IF;

    -- 9. Analytics (backoffice)
    SELECT COUNT(*) INTO existing_count 
    FROM public.modules 
    WHERE level = 'backoffice' AND name = 'Analytics';
    IF existing_count = 0 THEN
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES ('Analytics', 'backoffice', 'BarChart', '2025-05-18 17:00:02.311079+00'::timestamptz, '2025-06-17 06:18:50.9+00'::timestamptz, 4, NULL, false);
    END IF;

    -- 10. EduSafe Resources (backoffice)
    SELECT COUNT(*) INTO existing_count 
    FROM public.modules 
    WHERE level = 'backoffice' AND name = 'EduSafe Resources';
    IF existing_count = 0 THEN
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES ('EduSafe Resources', 'backoffice', 'FileText', '2025-05-18 17:00:02.311079+00'::timestamptz, '2025-05-18 17:00:02.311079+00'::timestamptz, 5, NULL, true);
    END IF;

    -- 11. Incidents (user)
    SELECT COUNT(*) INTO existing_count 
    FROM public.modules 
    WHERE level = 'user' AND name = 'Incidents';
    IF existing_count = 0 THEN
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES ('Incidents', 'user', 'AlertTriangle', '2025-05-18 17:00:02.311079+00'::timestamptz, '2025-05-28 11:52:28.748+00'::timestamptz, 2, '/incidents', true);
    END IF;

    -- 12. Transport Safety (user)
    SELECT COUNT(*) INTO existing_count 
    FROM public.modules 
    WHERE level = 'user' AND name = 'Transport Safety';
    IF existing_count = 0 THEN
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES ('Transport Safety', 'user', 'Car', '2025-05-18 17:00:02.311079+00'::timestamptz, '2025-05-28 11:52:54.588+00'::timestamptz, 5, '/transport-safety', true);
    END IF;

    -- 13. Employee Verification (user)
    SELECT COUNT(*) INTO existing_count 
    FROM public.modules 
    WHERE level = 'user' AND name = 'Employee Verification';
    IF existing_count = 0 THEN
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES ('Employee Verification', 'user', 'FileCheck', '2025-05-18 17:00:02.311079+00'::timestamptz, '2025-05-28 11:52:49.158+00'::timestamptz, 4, '/employee-verification', true);
    END IF;

    -- 14. EduSafe Resources (user)
    SELECT COUNT(*) INTO existing_count 
    FROM public.modules 
    WHERE level = 'user' AND name = 'EduSafe Resources';
    IF existing_count = 0 THEN
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES ('EduSafe Resources', 'user', 'FileText', '2025-05-18 17:00:02.311079+00'::timestamptz, '2025-05-28 11:53:31.35+00'::timestamptz, 6, '/edusafe', true);
    END IF;

    -- 15. Import Configuration (backoffice)
    SELECT COUNT(*) INTO existing_count 
    FROM public.modules 
    WHERE level = 'backoffice' AND name = 'Import Configuration';
    IF existing_count = 0 THEN
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES ('Import Configuration', 'backoffice', 'DownloadCloud', '2025-10-10 07:26:58.607609+00'::timestamptz, '2025-10-10 07:27:37.339+00'::timestamptz, NULL, '/backoffice/import-configuration', true);
    END IF;

    -- 16. Modules (backoffice)
    SELECT COUNT(*) INTO existing_count 
    FROM public.modules 
    WHERE level = 'backoffice' AND name = 'Modules';
    IF existing_count = 0 THEN
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES ('Modules', 'backoffice', 'users', '2025-05-28 09:50:26.204893+00'::timestamptz, '2025-05-28 11:37:33.742+00'::timestamptz, 6, '/modules', true);
    END IF;

    -- 17. Compliance Documents (user)
    SELECT COUNT(*) INTO existing_count 
    FROM public.modules 
    WHERE level = 'user' AND name = 'Compliance Documents';
    IF existing_count = 0 THEN
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES ('Compliance Documents', 'user', 'ShieldCheck', '2025-10-29 16:50:29.148715+00'::timestamptz, '2025-10-29 16:50:29.148715+00'::timestamptz, NULL, '/compliance_documents', true);
    END IF;

    -- 18. Dashboard (backoffice)
    SELECT COUNT(*) INTO existing_count 
    FROM public.modules 
    WHERE level = 'backoffice' AND name = 'Dashboard';
    IF existing_count = 0 THEN
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES ('Dashboard', 'backoffice', 'LayoutDashboard', '2025-05-18 17:00:02.311079+00'::timestamptz, '2025-06-01 06:09:28.922+00'::timestamptz, 1, '/dashboard', true);
    END IF;

    -- 19. Assessment Templates (backoffice)
    SELECT COUNT(*) INTO existing_count 
    FROM public.modules 
    WHERE level = 'backoffice' AND name = 'Assessment Templates';
    IF existing_count = 0 THEN
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES ('Assessment Templates', 'backoffice', 'ClipboardCheck', '2025-05-18 17:00:02.311079+00'::timestamptz, '2025-06-17 06:18:42.93+00'::timestamptz, 3, NULL, false);
    END IF;

    -- 20. Dashboard (user)
    SELECT COUNT(*) INTO existing_count 
    FROM public.modules 
    WHERE level = 'user' AND name = 'Dashboard';
    IF existing_count = 0 THEN
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES ('Dashboard', 'user', 'LayoutDashboard', '2025-05-18 17:00:02.311079+00'::timestamptz, '2025-05-28 11:52:11.306+00'::timestamptz, 1, '/dashboard', true);
    END IF;

    RAISE NOTICE 'Default modules insertion completed';
  ELSE
    RAISE NOTICE 'modules table does not exist yet, skipping default modules insertion';
  END IF;
END $$;

