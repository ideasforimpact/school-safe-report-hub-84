-- Update Compliance Documents icon to ShieldCheck to differentiate from Dashboard
-- This ensures Compliance Documents has a distinct icon from Dashboard (which uses LayoutDashboard)

DO $$
BEGIN
  -- Check if modules table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'modules'
  ) THEN
    
    -- Update Compliance Documents (user level) icon to ShieldCheck
    UPDATE public.modules
    SET icon = 'ShieldCheck',
        updated_at = now()
    WHERE level = 'user' 
      AND name = 'Compliance Documents'
      AND (icon IS NULL OR icon != 'ShieldCheck');
    
    -- Log the update
    IF FOUND THEN
      RAISE NOTICE 'Updated Compliance Documents (user) icon to ShieldCheck';
    ELSE
      RAISE NOTICE 'Compliance Documents (user) module not found or already has ShieldCheck icon';
    END IF;
    
    -- Also ensure Dashboard (user level) has LayoutDashboard icon
    UPDATE public.modules
    SET icon = 'LayoutDashboard',
        updated_at = now()
    WHERE level = 'user' 
      AND name = 'Dashboard'
      AND (icon IS NULL OR icon != 'LayoutDashboard');
    
    IF FOUND THEN
      RAISE NOTICE 'Updated Dashboard (user) icon to LayoutDashboard';
    END IF;
    
  ELSE
    RAISE NOTICE 'modules table does not exist, skipping icon update';
  END IF;
END $$;

