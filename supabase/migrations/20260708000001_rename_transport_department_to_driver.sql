-- Rename the "transport" department to "driver". Employees already assigned
-- to this department keep the same department_id, so they automatically
-- show up as "Driver" once this row is renamed — no employee data changes.

UPDATE public.employee_departments
SET department_name = 'driver'
WHERE department_name = 'transport';
