-- Feature 4 (H-1, H-2) — tighten storage.objects RLS so the
-- `employee-documents` and `vehicle-documents` buckets are scoped to the
-- requesting user's active client. Pre-Feature-4 these buckets were
-- effectively open to any authenticated request — easily exploitable
-- once multi-client logins expose the existence of other clients to a
-- user.
--
-- Path conventions observed in the application:
--   employee-documents: <employee_id>/<doc_type>_<ts>.<ext>
--     → scope via JOIN: employee_id IN (SELECT id FROM employees
--       WHERE client_id = get_current_user_client_id())
--   vehicle-documents:  <client_id>/<vehicle_id>/<ts>_<rand>_<file>
--     → scope by first folder = client_id directly
--
-- Both policies include an explicit backoffice-admin escape hatch so
-- SaaS owners can still inspect/repair documents across clients via
-- the existing tooling.

-- =========================================================================
-- employee-documents — replace the four wide-open policies
-- =========================================================================

DROP POLICY IF EXISTS "Anyone can read employee documents"   ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload employee documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update employee documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete employee documents" ON storage.objects;

CREATE POLICY "Read employee documents scoped to current client"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-documents'
  AND (
    public.is_current_user_backoffice_admin() = true
    OR (
      (storage.foldername(name))[1] IS NOT NULL
      AND (storage.foldername(name))[1]::uuid IN (
        SELECT e.id
          FROM public.employees e
         WHERE e.client_id = public.get_current_user_client_id()
      )
    )
  )
);

CREATE POLICY "Upload employee documents scoped to current client"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'employee-documents'
  AND (
    public.is_current_user_backoffice_admin() = true
    OR (
      (storage.foldername(name))[1] IS NOT NULL
      AND (storage.foldername(name))[1]::uuid IN (
        SELECT e.id
          FROM public.employees e
         WHERE e.client_id = public.get_current_user_client_id()
      )
    )
  )
);

CREATE POLICY "Update employee documents scoped to current client"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'employee-documents'
  AND (
    public.is_current_user_backoffice_admin() = true
    OR (
      (storage.foldername(name))[1] IS NOT NULL
      AND (storage.foldername(name))[1]::uuid IN (
        SELECT e.id
          FROM public.employees e
         WHERE e.client_id = public.get_current_user_client_id()
      )
    )
  )
);

CREATE POLICY "Delete employee documents scoped to current client"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'employee-documents'
  AND (
    public.is_current_user_backoffice_admin() = true
    OR (
      (storage.foldername(name))[1] IS NOT NULL
      AND (storage.foldername(name))[1]::uuid IN (
        SELECT e.id
          FROM public.employees e
         WHERE e.client_id = public.get_current_user_client_id()
      )
    )
  )
);

-- =========================================================================
-- vehicle-documents — replace the four authenticated-but-unscoped policies
-- =========================================================================

DROP POLICY IF EXISTS "Vehicle documents are accessible by authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload vehicle documents"                       ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own vehicle documents"             ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own vehicle documents"             ON storage.objects;

CREATE POLICY "Read vehicle documents scoped to current client"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'vehicle-documents'
  AND (
    public.is_current_user_backoffice_admin() = true
    OR (
      (storage.foldername(name))[1] IS NOT NULL
      AND (storage.foldername(name))[1]::uuid = public.get_current_user_client_id()
    )
  )
);

CREATE POLICY "Upload vehicle documents scoped to current client"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-documents'
  AND (
    public.is_current_user_backoffice_admin() = true
    OR (
      (storage.foldername(name))[1] IS NOT NULL
      AND (storage.foldername(name))[1]::uuid = public.get_current_user_client_id()
    )
  )
);

CREATE POLICY "Update vehicle documents scoped to current client"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vehicle-documents'
  AND (
    public.is_current_user_backoffice_admin() = true
    OR (
      (storage.foldername(name))[1] IS NOT NULL
      AND (storage.foldername(name))[1]::uuid = public.get_current_user_client_id()
    )
  )
);

CREATE POLICY "Delete vehicle documents scoped to current client"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vehicle-documents'
  AND (
    public.is_current_user_backoffice_admin() = true
    OR (
      (storage.foldername(name))[1] IS NOT NULL
      AND (storage.foldername(name))[1]::uuid = public.get_current_user_client_id()
    )
  )
);
