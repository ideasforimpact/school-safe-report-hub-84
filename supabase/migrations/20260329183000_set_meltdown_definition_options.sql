-- Set meltdown sub-definition options for existing data
UPDATE public.child_audit_look_up
SET
  definition = '["< 5 minutes","5-15 minutes","15-30 minutes","> 30 minutes"]',
  updated_at = now()
WHERE item_group = 'meltdown'
  AND label = 'Meltdown occurred'
  AND type IN ('in_school', 'in_hostel');
