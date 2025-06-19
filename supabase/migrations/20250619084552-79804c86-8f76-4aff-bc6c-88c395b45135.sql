
-- Enable Row Level Security on clients and modules tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to check if current user is a backoffice admin
CREATE OR REPLACE FUNCTION public.is_backoffice_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.backoffice_users 
    WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    AND is_saas_admin = true
  );
$$;

-- RLS Policies for clients table
CREATE POLICY "Backoffice admins can view all clients" 
  ON public.clients 
  FOR SELECT 
  USING (public.is_backoffice_admin());

CREATE POLICY "Backoffice admins can create clients" 
  ON public.clients 
  FOR INSERT 
  WITH CHECK (public.is_backoffice_admin());

CREATE POLICY "Backoffice admins can update clients" 
  ON public.clients 
  FOR UPDATE 
  USING (public.is_backoffice_admin());

CREATE POLICY "Backoffice admins can delete clients" 
  ON public.clients 
  FOR DELETE 
  USING (public.is_backoffice_admin());

-- RLS Policies for modules table
CREATE POLICY "Backoffice admins can view all modules" 
  ON public.modules 
  FOR SELECT 
  USING (public.is_backoffice_admin());

CREATE POLICY "Backoffice admins can create modules" 
  ON public.modules 
  FOR INSERT 
  WITH CHECK (public.is_backoffice_admin());

CREATE POLICY "Backoffice admins can update modules" 
  ON public.modules 
  FOR UPDATE 
  USING (public.is_backoffice_admin());

CREATE POLICY "Backoffice admins can delete modules" 
  ON public.modules 
  FOR DELETE 
  USING (public.is_backoffice_admin());
