-- Drop existing global unique constraint on employee_id
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_employee_id_key;

-- Add new client-scoped composite unique constraint
ALTER TABLE employees ADD CONSTRAINT employees_employee_id_client_id_key 
UNIQUE (employee_id, client_id);